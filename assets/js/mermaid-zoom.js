// Click-to-zoom lightbox for rendered Mermaid diagrams.
//
// Adds a focusable "expand" button to each rendered diagram and opens a
// full-screen overlay with pan + zoom (mouse wheel, +/- buttons, drag, and
// double-click). Pure vanilla JS, no dependencies. mermaid-init.js calls
// window.mermaidZoom.decorate() after every (re)render to (re)attach the
// buttons, since re-rendering replaces the diagram's contents.
(function () {
  "use strict";

  // Feather "maximize-2" (stroke) for the expand button; Octicon "x" (fill)
  // for the close button.
  var EXPAND_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  var CLOSE_ICON =
    '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>';

  var MIN_SCALE = 0.2;
  var MAX_SCALE = 8;

  var overlay = null;
  var stage = null;
  var content = null;
  var state = { scale: 1, x: 0, y: 0 };
  var natW = 0;
  var natH = 0;
  var drag = null;
  var touch = null;
  var lastTrigger = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyTransform() {
    content.style.transform =
      "translate(" + state.x + "px," + state.y + "px) scale(" + state.scale + ")";
  }

  // Reset zoom so the whole diagram fits and is centred in the stage. Small
  // diagrams are scaled up (vector, so still crisp) but auto-fit growth is
  // capped. Enlarging is done with a transform, never by resizing the SVG, so
  // the HTML labels keep their on-page layout and never clip.
  function fit() {
    var s = stage.getBoundingClientRect();
    var scale =
      natW && natH
        ? Math.min((s.width * 0.96) / natW, (s.height * 0.96) / natH)
        : 1;
    state.scale = clamp(scale, MIN_SCALE, 3);
    state.x = (s.width - natW * state.scale) / 2;
    state.y = (s.height - natH * state.scale) / 2;
    applyTransform();
  }

  // Zoom by `factor`, anchored at the given viewport point (defaults to the
  // centre of the stage) so the point under the cursor stays put.
  function zoomBy(factor, clientX, clientY) {
    var s = stage.getBoundingClientRect();
    var px = clientX == null ? s.width / 2 : clientX - s.left;
    var py = clientY == null ? s.height / 2 : clientY - s.top;
    var next = clamp(state.scale * factor, MIN_SCALE, MAX_SCALE);
    if (next === state.scale) {
      return;
    }
    state.x = px - ((px - state.x) / state.scale) * next;
    state.y = py - ((py - state.y) / state.scale) * next;
    state.scale = next;
    applyTransform();
  }

  function onToolbarClick(e) {
    var btn = e.target.closest("[data-mz]");
    if (!btn) {
      return;
    }
    var action = btn.getAttribute("data-mz");
    if (action === "in") {
      zoomBy(1.25);
    } else if (action === "out") {
      zoomBy(0.8);
    } else if (action === "reset") {
      fit();
    } else if (action === "close") {
      close();
    }
  }

  function onWheel(e) {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
  }

  function onDblClick(e) {
    e.preventDefault();
    zoomBy(state.scale < 2 ? 2 : 0.5, e.clientX, e.clientY);
  }

  function onPointerDown(e) {
    if (e.button !== 0 || e.target.closest(".mz-toolbar")) {
      return;
    }
    drag = { x: e.clientX, y: e.clientY, ox: state.x, oy: state.y };
    overlay.classList.add("is-dragging");
  }

  function onPointerMove(e) {
    if (!drag) {
      return;
    }
    state.x = drag.ox + (e.clientX - drag.x);
    state.y = drag.oy + (e.clientY - drag.y);
    applyTransform();
  }

  function onPointerUp() {
    drag = null;
    if (overlay) {
      overlay.classList.remove("is-dragging");
    }
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1 || e.target.closest(".mz-toolbar")) {
      return;
    }
    var t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, ox: state.x, oy: state.y };
  }

  function onTouchMove(e) {
    if (!touch || e.touches.length !== 1) {
      return;
    }
    e.preventDefault();
    var t = e.touches[0];
    state.x = touch.ox + (t.clientX - touch.x);
    state.y = touch.oy + (t.clientY - touch.y);
    applyTransform();
  }

  function onTouchEnd() {
    touch = null;
  }

  function onKeydown(e) {
    if (!overlay || overlay.hidden) {
      return;
    }
    if (e.key === "Escape") {
      close();
    } else if (e.key === "+" || e.key === "=") {
      zoomBy(1.25);
    } else if (e.key === "-" || e.key === "_") {
      zoomBy(0.8);
    } else if (e.key === "0") {
      fit();
    }
  }

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "mz-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Diagram preview");

    var toolbar = document.createElement("div");
    toolbar.className = "mz-toolbar";
    toolbar.innerHTML =
      '<button type="button" class="mz-btn" data-mz="out" aria-label="Zoom out">&minus;</button>' +
      '<button type="button" class="mz-btn" data-mz="reset" aria-label="Reset zoom">Reset</button>' +
      '<button type="button" class="mz-btn" data-mz="in" aria-label="Zoom in">+</button>' +
      '<button type="button" class="mz-btn mz-close" data-mz="close" aria-label="Close preview">' +
      CLOSE_ICON +
      "</button>";

    stage = document.createElement("div");
    stage.className = "mz-stage";

    content = document.createElement("div");
    content.className = "mz-content";
    stage.appendChild(content);

    overlay.appendChild(toolbar);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);

    toolbar.addEventListener("click", onToolbarClick);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("dblclick", onDblClick);
    stage.addEventListener("click", function (e) {
      if (e.target === stage) {
        close();
      }
    });
    overlay.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    overlay.addEventListener("touchstart", onTouchStart, { passive: false });
    overlay.addEventListener("touchmove", onTouchMove, { passive: false });
    overlay.addEventListener("touchend", onTouchEnd);
    document.addEventListener("keydown", onKeydown);
  }

  // Open the lightbox with a clone of the given rendered <svg>.
  function open(svg, trigger) {
    if (!overlay) {
      buildOverlay();
    }
    lastTrigger = trigger || null;

    // Clone at the diagram's natural (on-page) pixel size so the HTML labels
    // keep the exact layout they already have. Zooming is applied purely via a
    // CSS transform in fit()/zoomBy(), which scales without re-laying-out the
    // content, so label text never reflows or clips.
    var rect = svg.getBoundingClientRect();
    natW = Math.round(rect.width) || 800;
    natH = Math.round(rect.height) || 600;

    // Mermaid sizes each node box to its label width using the page font. The
    // overlay lives on <body>, which can inherit a different font, so pin the
    // clone's font to the original's computed values — otherwise the labels
    // reflow wider than their boxes and clip.
    var cs = window.getComputedStyle(svg);

    var clone = svg.cloneNode(true);
    clone.removeAttribute("width");
    clone.removeAttribute("height");
    clone.style.maxWidth = "none";
    clone.style.maxHeight = "none";
    clone.style.width = natW + "px";
    clone.style.height = natH + "px";
    clone.style.fontFamily = cs.fontFamily;
    clone.style.fontSize = cs.fontSize;
    clone.style.fontWeight = cs.fontWeight;
    clone.style.lineHeight = cs.lineHeight;
    clone.style.letterSpacing = cs.letterSpacing;

    content.innerHTML = "";
    content.appendChild(clone);

    overlay.hidden = false;
    document.documentElement.classList.add("mz-open");
    requestAnimationFrame(fit);

    var closeBtn = overlay.querySelector(".mz-close");
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function close() {
    if (!overlay || overlay.hidden) {
      return;
    }
    overlay.hidden = true;
    document.documentElement.classList.remove("mz-open");
    content.innerHTML = "";
    if (lastTrigger && lastTrigger.focus) {
      lastTrigger.focus();
    }
    lastTrigger = null;
  }

  // (Re)attach the expand button and click handler to every rendered diagram.
  // Idempotent: safe to call after each render.
  function decorate() {
    var diagrams = document.querySelectorAll("pre.mermaid");
    Array.prototype.forEach.call(diagrams, function (pre) {
      if (!pre.querySelector("svg")) {
        return;
      }
      pre.classList.add("mz-enabled");

      if (!pre.querySelector(".mz-expand")) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mz-expand";
        btn.setAttribute("aria-label", "Open diagram in zoomed preview");
        btn.innerHTML = EXPAND_ICON;
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var svg = pre.querySelector("svg");
          if (svg) {
            open(svg, btn);
          }
        });
        pre.appendChild(btn);
      }

      // Attach the diagram-wide click handler once; it persists across
      // re-renders because the <pre> element itself is reused.
      if (!pre.hasAttribute("data-mz-click")) {
        pre.setAttribute("data-mz-click", "");
        pre.addEventListener("click", function (e) {
          if (e.target.closest(".mz-expand")) {
            return;
          }
          var svg = pre.querySelector("svg");
          if (svg) {
            open(svg, pre);
          }
        });
      }
    });
  }

  window.mermaidZoom = { decorate: decorate, open: open };

  // Safety net for diagrams already present (the real trigger is the hook in
  // mermaid-init.js, which runs after rendering completes).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", decorate);
  } else {
    decorate();
  }
})();
