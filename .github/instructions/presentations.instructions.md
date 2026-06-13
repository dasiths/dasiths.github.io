---
description: "Instructions for converting blog posts or articles into self-contained HTML slide presentations. Covers architecture, styling, slide markup, and content adaptation."
applyTo: "presentations/**"
---

# Presentation Generation Instructions

Convert a blog post or article into a self-contained HTML slide presentation hosted under `/presentations/<slug>/index.html`.

## Before You Start (required)

Before generating any files, ask the user and wait for answers:

1. **Slug** — "What slug should the presentation use?" This sets the folder name (`/presentations/<slug>/`), the `localStorage` key (`<slug>-deck-mode`), and the title-slide/wordmark text. Suggest a default derived from the blog post filename or title, but confirm it.
2. **Visual theme and motif** — "What visual theme and motif do you want?" Confirm before writing any CSS:
   - The overall **mood/era** (e.g. retro 90s, clean editorial, technical/terminal, warm/organic, dark/neon).
   - The **color palette** (accent colors) and **fonts** to load.
   - Any **decorative motif** (background pattern, card texture, custom CSS illustrations) and whether it should appear, or whether the deck should stay minimal.
   - Propose 1-2 concrete theme options with example palettes if the user is unsure, but do not assume the errand deck's 90s corner-shop theme — that was specific to that post.

Only proceed to scaffolding once the slug and theme are confirmed.

## Reference Files

These files live next to this instructions file and contain the complete base code. An agent should read them when generating a new presentation:

| File | Purpose |
|------|---------|
| `.github/instructions/presentations-base.css` | Full structural CSS: tokens, chrome, slide layout, reveal system, all components. Copy into the `<style>` of each new presentation and customize tokens. |
| `.github/instructions/presentations-engine.js` | Full JavaScript engine: mode switching, keyboard nav, IntersectionObserver, slide numbering, data-step sequencing, typing animation. Copy into a `<script>` block before `</body>`. |
| `.github/instructions/presentations-scaffold.html` | Complete HTML skeleton showing document structure, chrome markup, and example slides using each component type. Use as the starting point for every new presentation. |
| `presentations/errand/index.html` | A fully realized example (90s corner-shop theme). Shows how theming, custom CSS illustrations, Mermaid diagrams, and all components come together in a real deck. |
| `presentations/index.html` | The gallery landing page that lists every deck. Standalone (no shared CSS/JS). Add a card here for each new presentation — see Gallery Index. |

**Workflow**: Start from `presentations-scaffold.html`. Paste in the CSS from `presentations-base.css` and JS from `presentations-engine.js`. Then customize the `:root` tokens, fonts, and optional theme motifs for the new presentation's content. Finally, register the new deck in `presentations/index.html` (see Gallery Index below).

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

### Visual scenes (the fun part)

The decks are brought to life by **bespoke, hand-built CSS illustrations** — one small scene per slide that visualizes that slide's metaphor. These are not stock graphics or icons; they are made of positioned `<div>`s with gradients, borders, `clip-path`, and `-webkit-mask`, then given **subtle infinite animations** so they feel alive without distracting. This is a signature part of the style and worth the effort.

- Wrap each illustration in `<div class="scene" aria-hidden="true">` (or `scene compact` for content slides). On title/setup slides, the scene sits in the second column of a `.titlegrid`/`.cols`.
- Build the art from semantic-ish nested divs (e.g. `.shop > .shop-sign + .shop-awning + .shop-front`). Keep it pure CSS/HTML — no images, no SVG files, no external assets.
- Each scene **enters** with a shared rise animation (e.g. `shopRise`: fade + translateY) on load.
- Each scene has **one or two ambient loops** — small, slow, `infinite` — that suggest life. Keep amplitude tiny.
- **All scene animation must be disabled** under `@media (prefers-reduced-motion: reduce)` (the base CSS already blanket-disables animations; keep custom keyframes inside that contract).

**Scene catalog from the errand deck** (read [presentations/errand/index.html](presentations/errand/index.html) for the actual CSS — copy and re-skin these as starting points):

| Scene | What it depicts | Ambient animation |
|-------|-----------------|-------------------|
| `.shop` | Shop facade: sign, striped awning (masked scallops), window with marker price | `pricewobble`, `openglow` on the OPEN sign |
| `.streetscene` | Terrace of buildings + corner shop + pavement + lamppost, with a kid walking | `walk` (kid strides back and forth), `flicker` (lamp) |
| `.till` | Cash register: display, keypad, drawer, poking receipt slip | `nosale` (display blinks) |
| `.oldreceipt` | Aged, curling receipt pinned up, with an angled "EXPIRED"-style stamp | `stamppulse` (stamp throbs) |
| `.figures` | Two figures (parent + helper) joined by a dashed "authority" link | `flow` (dot travels the link), `bob` (helper bobs) |
| `.trolley` | Overflowing shopping trolley with stacked items | `teeter` (a balanced item rocks) |
| `.signpost` | Crossroads signpost with three directional arms | `swing` (one arm sways) |
| `.shelf` | Shop shelf of goods with verdict badges (✓ / ✗ / ?) | `qpulse` (the "?" badge pulses) |
| `.stopscene` | STOP sign next to a till still printing a receipt | `stoppulse` (sign), `feed` (receipt scrolls out) |

The point isn't to reuse these exact scenes — they're corner-shop specific. The point is the **technique**: invent a small CSS illustration for each slide's metaphor in the chosen theme, and animate it subtly. Match the new presentation's confirmed theme/motif.

### Background and surface motifs

Optional, theme-specific decoration that runs behind or across the whole deck:

- **Ambient background** — a fixed, `z-index: -1`, low-opacity layer of scattered shapes (the errand deck's `.memphis` confetti: dots, triangles, squares, zigzags, plus-signs). Set `pointer-events: none` and `aria-hidden`.
- **Surface texture** — a faint repeating-gradient texture layered onto cards/panels via `background-image` (the errand deck's kraft-paper look on `.card`, `.abc .aff`, `.duo .half`).
- **Divider treatment** — a distinct look for dark divider slides (the errand deck's `.board` chalkboard: dotted "chalk dust" background, dashed border frame, marker-font heading, a "TODAY'S SPECIALS" tab). Apply with `class="slide dark board"`.

Use these only when they reinforce the theme; a minimal deck may skip all three.

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
10. **Include a title slide and a closing slide.** Title slide carries the breadcrumb + series + date line (`.deckmeta`, see Breadcrumb Navigation), the post title, subtitle, and navigation hints. Closing slide links back to the full post and any relevant resources.

## Mermaid Diagrams

- Wrap in `<div class="merframe"><div class="mermaid">...</div><p class="mercap">Caption</p></div>`.
- Configure Mermaid with `theme: 'base'` and custom `themeVariables` matching the presentation's color tokens.
- Use `securityLevel: 'loose'` and `startOnLoad: true`.

## Accessibility and Quality

- All decorative scenes: `aria-hidden="true"`.
- `@media (prefers-reduced-motion: reduce)` disables all animations and transitions.
- Print styles: hide chrome, show all slides stacked, show talk tracks.
- Keyboard navigation must work completely without mouse.
- Topbar shows: breadcrumb up-link (`Decks`), wordmark (presentation title), mode toggle, notes toggle, menu toggle, fullscreen toggle.

## Breadcrumb Navigation (required for every deck)

Every deck must give the viewer a way back up to the gallery. The topbar's left edge is a breadcrumb trail:

```html
<header class="topbar">
  <a class="crumb" href="/presentations/">Decks</a>
  <span class="crumb-sep" aria-hidden="true">›</span>
  <a class="wordmark" href="#s-title">Series · <b>Deck Title</b></a>
  <span class="spacer"></span>
  <!-- mode / notes / menu / full buttons -->
</header>
```

- `.crumb` links **up one level** to the gallery (`/presentations/`), which itself links back to the blog home. Do not point it at `/` directly.
- `.crumb-sep` (`›`) is decorative — mark it `aria-hidden="true"`.
- The `.wordmark` stays the **current page** in the trail and continues to link to `#s-title` (the title slide). Its form is **`<Series> · <Deck Title>`** — the lead label is the deck's **series name** (the same series used in the gallery), not a topic or in-world flavor label. This keeps the topbar breadcrumb identical in shape across every deck.
- `.crumb` and `.crumb-sep` styles live in `presentations-base.css`; the `:hover` color uses the deck's primary accent token. Copy them alongside `.wordmark`.
- The gallery `index.html` is the top of the trail and keeps its own `← dasith.me` home link — no `.crumb` needed there.

### Title-slide breadcrumb + date line

The topbar breadcrumb is mirrored on the title slide itself by a `.deckmeta` line, the first element inside the title slide's content column (before the kicker):

```html
<p class="deckmeta rv">
  <a href="/presentations/">Decks</a>
  <span class="sep" aria-hidden="true">›</span>
  <span class="ser"><Series Name></span>
  <span class="sep" aria-hidden="true">·</span>
  <time datetime="YYYY-MM-DD">DD Mon YYYY</time>
</p>
```

- The **series** must match the deck's series in the gallery and the topbar wordmark.
- The **date** is the companion blog post's date (`YYYY-MM-DD` from `/_posts/`); show it human-friendly (e.g. `10 Jun 2026`) with the ISO value in `datetime`.
- `.deckmeta` styles live in `presentations-base.css`; the series label and link hover use the deck's accent. The separators are `aria-hidden`.
- This is the only place the date appears inside a deck — keep it on the title slide, not on every slide.

## File Placement

- Path: `/presentations/<slug>/index.html`
- Companion blog post: `/_posts/YYYY-MM-DD-<slug>.md`
- The blog post should link to the presentation and vice versa.
- Teaser image if used: `/assets/images/<slug>_teaser.png`

## Analytics and Tracking (required for every page)

Presentations are standalone static HTML with **no Jekyll front matter**, so Jekyll copies them verbatim and they do **not** inherit the site's `_includes/analytics.html` or `_includes/seo.html`. Tracking must therefore be wired in per page.

To keep tracking consistent and in one place, every page under `/presentations/` (each deck **and** the gallery `index.html`) must reference the shared snippet `presentations/shared/analytics.js`. Add this one line in the `<head>`, right after the `<title>`/`<meta name="description">`:

```html
<script src="/presentations/shared/analytics.js" defer></script>
```

That single file is the source of truth for:

- **Google Analytics (gtag.js)** — page-view tracking.
- **Search-engine site verification** — Google (`google-site-verification`) and Bing (`msvalidate.01`) meta tags injected at runtime.

Rules:

- **Never inline the gtag snippet or hard-code the tracking ID** into a deck. Always reference the shared file so the IDs live in exactly one place.
- The IDs inside `presentations/shared/analytics.js` mirror `_config.yml` (`analytics.google.tracking_id`, `google_site_verification`, `bing_site_verification`). If those change, update the shared file too.
- The snippet skips `localhost`/`127.0.0.1` so local previews aren't tracked — no extra work needed for dev.

## Gallery Index (required for every new deck)

`presentations/index.html` is a self-contained gallery landing page that lists every deck under `/presentations/`. It uses the same dark terminal/neon tokens, fonts, and ambient grid backdrop as a deck, but is a standalone page — no shared CSS/JS. **After creating a new presentation, add it to this gallery.**

### Series grouping (first-class)

Decks are organized into **series** — a named track of related talks. `<main class="gallery">` is a vertical stack of `<section class="series">` blocks, each with a heading and its own grid of deck cards. A series may contain a single deck; the grouping still applies.

```html
<section class="series" style="--s: var(--accent-N)">
  <header class="series-head">
    <p class="series-label">Series</p>
    <h2 class="series-title"><Series name></h2>
    <p class="series-blurb">One sentence describing the through-line of the series.</p>
  </header>
  <div class="series-grid">
    <!-- one or more <article> deck cards -->
  </div>
</section>
```

- **Place a new deck in its series.** If the series already exists, copy an `<article>` into that section's `.series-grid`. If it's a new series, copy a whole `<section class="series">` block, set a distinct `--s` accent, and write the `series-title` and `series-blurb`.
- **`--s` is the series accent** (`--accent-1`..`--accent-5`), used by the `series-label` and its tick mark. Keep consecutive series visually distinct.
- Order series most-relevant/most-recent first.

### Deck card

To add a deck, copy an existing `<article>` block inside a `.series-grid` and update it:

```html
<article>
  <a class="deck" href="/presentations/<slug>/" style="--c: var(--accent-N); --th-bg: #0a0e16;"
     aria-label="Open: <Full deck title>">
    <div class="thumb th-<motif>" aria-hidden="true">
      <!-- bespoke CSS mini-thumbnail for this deck's theme -->
    </div>
    <div class="meta">
      <span class="tag">Topic label <span class="yr">· Event / context</span><time class="date" datetime="YYYY-MM-DD">DD Mon YYYY</time></span>
      <h2><Short title>: <em>accent phrase</em> rest of title</h2>
      <p>One- or two-sentence synopsis pulled from the deck's title-slide lede.</p>
      <div class="chips"><span class="chip">Tag</span><span class="chip">Tag</span></div>
      <span class="go">Open deck →</span>
    </div>
  </a>
</article>
```

Rules for gallery entries:

- **Pick a distinct `--c` accent** (`--accent-1`..`--accent-5`) so cards don't repeat the same color side by side. Set `--th-bg` to a near-black tinted to the deck's theme. A deck's `--c` is usually the same as its series `--s`, but it doesn't have to be.
- **Every deck card carries a date.** Add a `<time class="date" datetime="YYYY-MM-DD">DD Mon YYYY</time>` at the end of the `.tag` row. Use the companion blog post's date (the `YYYY-MM-DD` from `/_posts/`). The machine-readable `datetime` attribute is ISO; the visible text is human-friendly (e.g. `10 Jun 2026`).
- **Build a bespoke CSS thumbnail**, not a screenshot or image. Add a `.th-<motif>` class and its styles in the `<style>` block (see `.th-ctx` terminal-window and `.th-shop` corner-shop examples). Re-skin the deck's own title-slide scene at small scale; keep one subtle `floatup`/ambient loop.
- **Reuse the deck's own title and lede** for `h2` and `p`, with one accent phrase in `<em>`.
- Keep the card a single `<a class="deck">` link wrapping both thumbnail and meta so the whole card is clickable; keep the `aria-label`.
- The gallery is **standalone** — do not import deck CSS. If you add tokens or a thumbnail motif, add them to this file's own `<style>`.

## What NOT to Do

- Do not use reveal.js, impress.js, or any external slide framework.
- Do not split a deck's own CSS/JS into multiple files — the deck's styles and engine stay inline in its `index.html`. (The shared `presentations/shared/analytics.js` is the one allowed exception; reference it, don't inline it.)
- Do not add a package.json or build step for the presentation.
- Do not use iframes.
- Do not inline or hard-code analytics/tracking IDs into a deck. Use the shared `presentations/shared/analytics.js` reference instead (see Analytics and Tracking).
- Do not over-animate. Ambient motion should be subtle, slow, and small in amplitude — one or two looping animations per scene, never flashy. Text content reveals via the `.rv`/`data-step` system, not custom animation.
- Do not make every presentation look the same. Theme each one to its content.
