// Enhances Rouge-highlighted fenced code blocks with a header bar (language
// label + copy-to-clipboard button) and an optional line-number gutter for
// multi-line blocks. Pure vanilla JS with no dependencies, loaded via
// `after_footer_scripts` in _config.yml. Mirrors the approach in mermaid-init.js.
//
// The matching styles live in _sass/_code-blocks.scss (.cb-header, .cb-body,
// .cb-gutter, .cb-copy). Mermaid blocks are skipped here because mermaid-init.js
// replaces them with rendered diagrams.
(function () {
  "use strict";

  // Friendly display names for common Rouge language tokens. Anything not
  // listed falls back to the upper-cased token; "text"/"plaintext" get no label.
  var LANG_NAMES = {
    cs: "C#",
    csharp: "C#",
    js: "JavaScript",
    javascript: "JavaScript",
    ts: "TypeScript",
    typescript: "TypeScript",
    py: "Python",
    python: "Python",
    rb: "Ruby",
    ruby: "Ruby",
    sh: "Shell",
    shell: "Shell",
    bash: "Bash",
    zsh: "Zsh",
    ps1: "PowerShell",
    powershell: "PowerShell",
    yml: "YAML",
    yaml: "YAML",
    json: "JSON",
    html: "HTML",
    xml: "XML",
    css: "CSS",
    scss: "SCSS",
    sql: "SQL",
    go: "Go",
    rust: "Rust",
    rs: "Rust",
    java: "Java",
    kotlin: "Kotlin",
    c: "C",
    cpp: "C++",
    "c++": "C++",
    php: "PHP",
    swift: "Swift",
    md: "Markdown",
    markdown: "Markdown",
    dockerfile: "Dockerfile",
    diff: "Diff",
    toml: "TOML",
    ini: "INI"
  };

  // Octicon "copy" and "check" glyphs (16x16, MIT-licensed paths).
  var COPY_ICON =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>';
  var CHECK_ICON =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>';

  function languageLabel(block) {
    var match = (block.className || "").match(/language-([\w+#-]+)/);
    if (!match) {
      return null;
    }
    var token = match[1].toLowerCase();
    if (token === "text" || token === "plaintext") {
      return null;
    }
    return LANG_NAMES[token] || token.toUpperCase();
  }

  // Shell prompt glyph for the single-line console theme.
  function promptSymbol(block) {
    var match = (block.className || "").match(/language-([\w+#-]+)/);
    var token = match ? match[1].toLowerCase() : "";
    if (
      token === "powershell" ||
      token === "ps1" ||
      token === "bat" ||
      token === "batch" ||
      token === "cmd"
    ) {
      return ">";
    }
    return "$";
  }

  // Copy via the async Clipboard API when available, with a hidden-textarea
  // fallback for older or non-secure contexts.
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "absolute";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(area);
      ok ? resolve() : reject();
    });
  }

  function buildCopyButton(getText) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "cb-copy";
    button.setAttribute("aria-label", "Copy code to clipboard");

    var icon = document.createElement("span");
    icon.className = "cb-copy-icon";
    icon.innerHTML = COPY_ICON;

    var label = document.createElement("span");
    label.className = "cb-copy-label";
    label.textContent = "Copy";

    button.appendChild(icon);
    button.appendChild(label);

    var resetTimer = null;
    function flash(success) {
      if (resetTimer) {
        clearTimeout(resetTimer);
      }
      button.classList.toggle("is-copied", success);
      icon.innerHTML = success ? CHECK_ICON : COPY_ICON;
      label.textContent = success ? "Copied!" : "Press Ctrl+C";
      resetTimer = setTimeout(function () {
        button.classList.remove("is-copied");
        icon.innerHTML = COPY_ICON;
        label.textContent = "Copy";
      }, 2000);
    }

    button.addEventListener("click", function () {
      copyToClipboard(getText()).then(
        function () {
          flash(true);
        },
        function () {
          flash(false);
        }
      );
    });

    return button;
  }

  // macOS-style window "traffic light" controls for the editor titlebar.
  function buildWindowDots() {
    var dots = document.createElement("span");
    dots.className = "cb-dots";
    dots.setAttribute("aria-hidden", "true");
    ["cb-dot-red", "cb-dot-yellow", "cb-dot-green"].forEach(function (cls) {
      var dot = document.createElement("span");
      dot.className = cls;
      dots.appendChild(dot);
    });
    return dots;
  }

  function enhance(block) {
    if (block.classList.contains("cb-enhanced")) {
      return;
    }
    // Leave Mermaid blocks for mermaid-init.js to replace with diagrams.
    if (
      block.classList.contains("language-mermaid") ||
      block.querySelector(".language-mermaid")
    ) {
      return;
    }
    var pre = block.querySelector("pre");
    if (!pre) {
      return;
    }
    var code = pre.querySelector("code") || pre;
    block.classList.add("cb-enhanced");

    // Source text without a trailing newline, shared by the copy button and
    // the line count.
    var text = code.textContent.replace(/\n+$/, "");
    var isMultiline = text.split("\n").length > 1;

    // Multi-line blocks get a code-editor titlebar (macOS window dots, a
    // centered title, copy button). Single-line blocks become a console row
    // instead (prompt glyph + inline copy, wired up further below).
    if (isMultiline) {
      var header = document.createElement("div");
      header.className = "cb-header cb-header--editor";
      header.appendChild(buildWindowDots());

      var lang = languageLabel(block);
      var langEl = document.createElement("span");
      langEl.className = "cb-lang";
      langEl.textContent = lang || "";
      header.appendChild(langEl);

      header.appendChild(
        buildCopyButton(function () {
          return text;
        })
      );
      block.insertBefore(header, block.firstChild);
    } else {
      block.classList.add("cb-console");
    }

    // Body wraps the prompt/gutter, the scrolling <pre>, and (for the console
    // theme) the copy button in a flex row.
    var body;
    if (pre.parentNode === block) {
      body = document.createElement("div");
      body.className = "cb-body";
      block.insertBefore(body, pre);
      body.appendChild(pre);
    } else {
      body = pre.parentNode; // e.g. div.highlight
      body.classList.add("cb-body");
    }

    if (isMultiline) {
      // Line-number gutter for multi-line blocks.
      var lineCount = text.split("\n").length;
      var numbers = [];
      for (var i = 1; i <= lineCount; i++) {
        numbers.push(i);
      }
      var gutter = document.createElement("span");
      gutter.className = "cb-gutter";
      gutter.setAttribute("aria-hidden", "true");
      gutter.textContent = numbers.join("\n");
      body.insertBefore(gutter, pre);
      block.classList.add("cb-has-lineno");
    } else {
      // Console theme: a prompt glyph and an inline copy button.
      var prompt = document.createElement("span");
      prompt.className = "cb-prompt";
      prompt.setAttribute("aria-hidden", "true");
      prompt.textContent = promptSymbol(block);
      body.insertBefore(prompt, pre);
      body.appendChild(
        buildCopyButton(function () {
          return text;
        })
      );
    }
  }

  function init() {
    var blocks = document.querySelectorAll(
      "div.highlighter-rouge, figure.highlight"
    );
    Array.prototype.forEach.call(blocks, enhance);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
