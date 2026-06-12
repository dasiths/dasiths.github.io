---
description: "Instructions for converting blog posts or articles into self-contained HTML slide presentations. Covers architecture, styling, slide markup, and content adaptation."
applyTo: "presentations/**"
---

# Presentation Generation Instructions

Convert a blog post or article into a self-contained HTML slide presentation hosted under `/presentations/<slug>/index.html`.

## Reference Files

These files live next to this instructions file and contain the complete base code. An agent should read them when generating a new presentation:

| File | Purpose |
|------|---------|
| `.github/instructions/presentations-base.css` | Full structural CSS: tokens, chrome, slide layout, reveal system, all components. Copy into the `<style>` of each new presentation and customize tokens. |
| `.github/instructions/presentations-engine.js` | Full JavaScript engine: mode switching, keyboard nav, IntersectionObserver, slide numbering, data-step sequencing, typing animation. Copy into a `<script>` block before `</body>`. |
| `.github/instructions/presentations-scaffold.html` | Complete HTML skeleton showing document structure, chrome markup, and example slides using each component type. Use as the starting point for every new presentation. |
| `presentations/errand/index.html` | A fully realized example (90s corner-shop theme). Shows how theming, custom CSS illustrations, Mermaid diagrams, and all components come together in a real deck. |

**Workflow**: Start from `presentations-scaffold.html`. Paste in the CSS from `presentations-base.css` and JS from `presentations-engine.js`. Then customize the `:root` tokens, fonts, and optional theme motifs for the new presentation's content.

## Architecture

- **Single HTML file.** No build step, no bundler. One `index.html` with inline `<style>` and inline `<script>`.
- **No YAML front matter.** Jekyll copies the file verbatim as a static asset.
- **Two modes** toggled by the `P` key, a topbar button, or `?mode=present` / `?mode=read`:
  - **Read mode** (default): single scrolling page, talk-track notes visible inline below each slide.
  - **Present mode**: one slide at a time, arrow/space navigation, speaker notes in a side panel (`N`), menu (`M`), fullscreen (`F`).
- **External dependencies**: only Mermaid from CDN (for sequence diagrams if needed). Everything else is self-contained.

## Base Scaffold

The engine consists of:

1. **Tokens** — CSS custom properties for colors, fonts, spacing (see `presentations-base.css` `:root`).
2. **Chrome** — topbar, progress bar, nav cluster, menu overlay, notes panel.
3. **Slide layout** — `body.present` (viewport-fitted) and `body.read` (stacked scrolling) rules.
4. **Reveal system** — `.rv` class for fade-up on intersection (read) or activation (present); `[data-step]` for sequenced reveals within a slide.
5. **Components** — `.kicker`, `.lede`, `.statement`, `.quote`, `.bullets`, `.card`, `.duo`, `.abc`, `.term`, `.maptbl`, `.chips`, `.stats`, `.loop`, `.thread`, `.cta`, `.merframe`.
6. **Script** — mode switching, keyboard shortcuts, IntersectionObserver for read-mode reveals, hash-based navigation, slide numbering, data-step sequencing, terminal typing animation (see `presentations-engine.js`).

## Theming

Each presentation has its own visual theme. The theme is NOT always 90s-retro. Choose a theme that fits the content:

- Define all theme colors, fonts, and motifs in `:root` CSS custom properties.
- Use Google Fonts loaded via `<link>` in the `<head>`.
- Theme-specific decorative elements (e.g. Memphis confetti, chalkboard slides, kraft-paper card textures) are optional motifs. Add them only when they serve the story.
- Per-slide accent color: `style="--c: var(--colorname)"` on the `<section>`.
- Dark slides: add class `dark` (and optionally `board` for chalkboard look).
- Provide a `--bg`, `--panel`, `--text`, `--muted`, `--faint`, `--line` set at minimum plus 3-5 accent colors.
- **Rotate the accent** across slides so consecutive sections feel distinct. Don't use the same `--c` on every slide.

## Typography System

Every presentation uses **three font roles**, defined as tokens and never mixed arbitrarily:

| Token | Role | Used by |
|-------|------|---------|
| `--display` | Sans-serif. The workhorse for headings and body. | `h1`, `.lede`, `.card p`, `.duo p`, most text |
| `--serif` | Italic serif. Editorial accent only. | `<em>` inside headings, `.statement`, `.quote` |
| `--mono` | Monospace, uppercase, wide letter-spacing. | `.kicker`, `.ttag`, `.mercap`, `.chip`, `.who`, `.num`, `.t-*`, table headers, captions, key pills |

The mono font always appears **uppercase with `letter-spacing: .12em–.26em`** for labels and metadata. The serif font is **always italic** and reserved for emphasis moments, never body copy.

### Heading style

- `h1` is large (`clamp(34px, 5vw, 66px)`), heavy (`font-weight: 750`), tight (`letter-spacing: -.028em`, `line-height: 1.04`), capped at `max-width: 16em`.
- Put **one or two accent words** in `<em>`. These render in **serif italic, in the slide's accent color** — this is the signature look. Example: `The bread shows the simple <em>case.</em>`
- Title-slide `h1` is larger (`clamp(44px, 7vw, 92px)`); use class `titleslide` on the section.
- On dark slides, `h1` color lightens automatically — no extra markup needed.
- Keep headlines as the **takeaway**, not a topic label (see Content Adaptation Rules).

### Emphasis conventions (important — they differ by context)

Inline emphasis means different things depending on where it sits:

- **In headings, `.statement`, `.quote`** → use `<em>` (or `<b>` in statement/quote). This turns the text **serif italic in the accent color**. Use it for the one phrase the slide pivots on.
- **In `.lede`, `.bullets`, `.card`, `.duo`** → use `<strong>` or `<b>`. This **does not change color or font** — it only darkens body text from `--muted` up to full `--text` for weight contrast.
- **Inline code** → wrap in `<code>`. Renders in mono with a faint accent-tinted background.

Do not use `<em>` for color emphasis inside body text, and do not use `<b>` expecting color inside body text — the rules above are deliberate and consistent across the deck.

## Slide Markup

Each slide is one `<section>`:

```html
<section class="slide" id="s-slug" data-title="Menu label" style="--c: var(--accent)">
  <div class="inner">
    <!-- content -->
  </div>
</section>
```

### Content structure per slide

1. **Kicker** — short uppercase label with slide counter: `<p class="kicker rv"><span class="snum"></span>Label</p>`
2. **Headline** — `<h1 class="rv">` with `<em>` for italic serif accent word.
3. **Lede** — `<p class="lede rv">` for the explanatory sub-line.
4. **Body** — use components: `.bullets`, `.card` grids, `.duo`, `.term`, `.quote`, `.statement`, `.merframe` for diagrams.
5. **Thread** — optional stitching line connecting to next idea: `<div class="thread">`.
6. **Talk track** — `<aside class="talk">` with `<span class="ttag">Talk track</span>` and `<p>` paragraphs.

### Reveal timing

- Add `class="rv"` for fade-up on slide activation.
- Use `style="--d:.06s"` increments to stagger reveals.
- Use `data-step="1"`, `data-step="2"` etc. for sequenced reveals in present mode.

### Component reference

Pick the component that matches the content shape. All accept the slide's `--c` accent.

| Component | Markup | Use for |
|-----------|--------|---------|
| Kicker | `<p class="kicker rv"><span class="snum"></span>LABEL</p>` | Section label above the headline. `snum` auto-fills slide number. |
| Headline | `<h1 class="rv">Text <em>accent.</em></h1>` | The slide's takeaway. |
| Lede | `<p class="lede rv">…</p>` | One- or two-sentence explanation under the headline. |
| Bullets | `<ul class="bullets"><li>…</li></ul>` | A short list of parallel points. |
| Cards | `<div class="grid-3"><div class="card">…</div></div>` | 2-3 parallel concepts, each with a title and blurb. `.grid-2` for two. |
| Duo | `<div class="duo"><div class="half">…</div></div>` | Two contrasting items side by side (this vs. that). |
| ABC | `<div class="abc"><div class="aff"><span class="letter">A</span>…</div></div>` | Three lettered/sequential explanation cards. |
| Statement | `<div class="statement rv">Big <b>point.</b></div>` | A single large serif pull-quote that fills the slide. |
| Quote | `<p class="quote">…<span class="attr">SOURCE</span></p>` | A cited or attributed line. |
| Thread | `<div class="thread"><p><b>Label</b> …</p></div>` | A transition stitch linking to the next idea. |
| Terminal | `<div class="term">…</div>` | A code/command block. Add `data-type` to a line to type it out on reveal. |
| Stats | `<div class="stats"><div class="stat"><span class="big">N</span><span class="cap">…</span></div></div>` | Big numbers with captions. |
| Loop | `<div class="loop"><span class="step">…</span><span class="larr">→</span>…</div>` | A short left-to-right process flow. |
| Map table | `<table class="maptbl">…</table>` | Dense mapping/glossary (story term → real term → meaning). |
| Chips | `<div class="chips"><span class="chip">TAG</span></div>` | A row of small uppercase tags. |
| CTA | `<div class="cta"><span class="ctag">LABEL</span><p>…</p></div>` | A closing call-to-action with links. |
| Mermaid | `<div class="merframe"><div class="mermaid">…</div><p class="mercap">…</p></div>` | A sequence/flow diagram. |
| Two-column | `<div class="cols"><div>…</div><div>…</div></div>` | Split a slide into text + visual or two text blocks. |

### Terminal typing animation

- Put commands in `.term` using `.t-cmd`, `.t-ok`, `.t-dim`, `.t-out`, `.t-row` rows.
- Add the `data-type` attribute to any element whose text should **type out character-by-character** when the slide is revealed. The engine captures the text on load and replays it. Reduced-motion users see the full text instantly.

### Visual scenes

- Wrap illustrative CSS art in `<div class="scene">` (or `scene compact`).
- Keep illustrations as pure CSS/HTML — no images unless the source post has them.
- Animate sparingly: subtle loops (`animation: ... infinite`) for ambient life. Respect `prefers-reduced-motion`.

## Content Adaptation Rules

When converting a blog post to slides:

1. **Read the entire post first.** Understand the narrative arc before structuring slides.
2. **One idea per slide.** Each slide should convey a single concept the audience can grasp in 10-15 seconds (present mode) or a comfortable scroll-stop (read mode).
3. **Preserve the post's voice.** If the post is conversational, the slides should be too. Don't corporate-ify.
4. **Headlines do the heavy lifting.** The `<h1>` on each slide should be the takeaway, not a topic label. Prefer "Saying your name is just *a claim*" over "Identity verification."
5. **Use the post's own phrasing.** Pull key sentences directly. Don't paraphrase into weaker versions.
6. **Talk track = the post's prose.** The `<aside class="talk">` holds the narrative that connects slides. This is where the post's longer explanations live. Keep it close to the original text but tightened for spoken delivery.
7. **Diagrams over description.** If the post explains a flow or sequence, render it as a Mermaid diagram inside a `.merframe`. Use the post's own labels.
8. **Tables become cards or grids.** Blog tables map to `.grid-2`, `.grid-3`, `.abc`, or `.maptbl` depending on content density.
9. **The post's structure IS the slide order.** Don't rearrange. If the post builds Part 1 → Part 2, the deck should too, with dark divider slides between parts.
10. **Include a title slide and a closing slide.** Title slide carries the post title, subtitle, and navigation hints. Closing slide links back to the full post and any relevant resources.

## Mermaid Diagrams

- Wrap in `<div class="merframe"><div class="mermaid">...</div><p class="mercap">Caption</p></div>`.
- Configure Mermaid with `theme: 'base'` and custom `themeVariables` matching the presentation's color tokens.
- Use `securityLevel: 'loose'` and `startOnLoad: true`.

## Accessibility and Quality

- All decorative scenes: `aria-hidden="true"`.
- `@media (prefers-reduced-motion: reduce)` disables all animations and transitions.
- Print styles: hide chrome, show all slides stacked, show talk tracks.
- Keyboard navigation must work completely without mouse.
- Topbar shows: wordmark (presentation title), mode toggle, notes toggle, menu toggle, fullscreen toggle.

## File Placement

- Path: `/presentations/<slug>/index.html`
- Companion blog post: `/_posts/YYYY-MM-DD-<slug>.md`
- The blog post should link to the presentation and vice versa.
- Teaser image if used: `/assets/images/<slug>_teaser.png`

## What NOT to Do

- Do not use reveal.js, impress.js, or any external slide framework.
- Do not split into multiple files (no separate CSS/JS).
- Do not add a package.json or build step for the presentation.
- Do not use iframes.
- Do not add tracking or analytics scripts.
- Do not over-animate. Ambient motion should be subtle and few. Most slides have zero custom animation.
- Do not make every presentation look the same. Theme each one to its content.
