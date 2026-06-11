// Mermaid diagram rendering for kramdown + rouge fenced ```mermaid blocks.
//
// Rouge has no mermaid lexer, so a ```mermaid fence is emitted as a plaintext
// code block wrapped in `.language-mermaid` (with the diagram source HTML-escaped
// inside a <code> element). Mermaid's own startOnLoad looks for `.mermaid`
// elements and expects the raw, unescaped source. This script bridges the two:
// it finds those code blocks, pulls out the unescaped source via textContent,
// swaps in a <pre class="mermaid"> element, then asks Mermaid to render.
(function () {
  "use strict";

  // The CDN + version for Mermaid. Pinned to a major version for stability.
  var MERMAID_SRC =
    "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

  // Pick the Mermaid theme that matches the current page theme.
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "default";
  }

  function findMermaidBlocks() {
    var blocks = [];
    document.querySelectorAll(".language-mermaid").forEach(function (el) {
      var codeEl = el.matches("code") ? el : el.querySelector("code");
      var source = (codeEl || el).textContent;
      // Replace the outermost wrapper so no empty <pre>/<div> is left behind.
      var wrapper =
        el.closest(".highlighter-rouge") || el.closest("pre") || el;
      if (source && source.trim()) {
        blocks.push({ wrapper: wrapper, source: source });
      }
    });
    return blocks;
  }

  function init() {
    var blocks = findMermaidBlocks();
    if (!blocks.length) {
      return;
    }

    import(MERMAID_SRC)
      .then(function (mod) {
        var mermaid = mod.default;

        // Swap each code block for a <pre class="mermaid">, keeping the raw
        // source in a data attribute so the diagram can be re-rendered later
        // (e.g. when the dark-mode toggle changes the theme).
        blocks.forEach(function (block) {
          var pre = document.createElement("pre");
          pre.className = "mermaid";
          pre.textContent = block.source;
          pre.setAttribute("data-mermaid-src", block.source);
          block.wrapper.replaceWith(pre);
        });

        function render() {
          mermaid.initialize({ startOnLoad: false, theme: currentTheme() });
          return mermaid.run();
        }

        // Expose a re-render hook for the theme toggle. Resets each diagram
        // back to its source before asking Mermaid to render again.
        window.rerenderMermaid = function () {
          document.querySelectorAll("pre.mermaid").forEach(function (pre) {
            var src = pre.getAttribute("data-mermaid-src");
            if (src) {
              pre.removeAttribute("data-processed");
              pre.textContent = src;
            }
          });
          render();
        };

        return render();
      })
      .catch(function (err) {
        console.error("Mermaid failed to load or render:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
