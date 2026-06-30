/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRESENTATION ENGINE — JavaScript Reference
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Copy this <script> block into each presentation's index.html before </body>.
 * It provides: mode switching, keyboard nav, IntersectionObserver reveals,
 * slide numbering, data-step sequencing, terminal typing, menu, notes panel.
 *
 * The only thing to customize per presentation is the localStorage key name
 * (search for 'deck-mode' below and prefix with your slug).
 */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const slides = $$('.slide');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = 0;
  let mode = 'read';

  /* ── auto slide numbers in kickers ── */
  slides.forEach((s, i) => {
    const n = $('.kicker .snum', s);
    if (n) n.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0') + ' · ';
  });

  /* ── menu (built from data-title) ── */
  const menu = $('#menu'), menuList = $('#menu-list');
  slides.forEach((s, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.textContent = s.dataset.title || s.id;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();
      go(i);
    });
    li.appendChild(a);
    menuList.appendChild(li);
  });
  const openMenu = () => { menu.classList.add('open'); markMenu(); };
  const closeMenu = () => menu.classList.remove('open');
  const toggleMenu = () => menu.classList.contains('open') ? closeMenu() : openMenu();
  const markMenu = () => $$('a', menuList).forEach((a, i) => a.classList.toggle('here', i === cur));

  /* ── data-step elements in reveal order ── */
  slides.forEach((s) => {
    s._steps = $$('[data-step]', s)
      .sort((a, b) => (parseFloat(a.dataset.step) || 0) - (parseFloat(b.dataset.step) || 0));
  });
  const clearDelays = (root = document) => $$('[data-step]', root).forEach((el) => { el.style.transitionDelay = ''; });

  /* ── terminal typing animation ── */
  $$('[data-type]').forEach((el) => { el.dataset.full = el.textContent; });
  let typeRun = 0;
  async function typeSlide(s) {
    const token = ++typeRun;
    const els = $$('[data-type]', s);
    if (!els.length) return;
    if (reduced) { els.forEach((el) => { el.textContent = el.dataset.full; }); return; }
    els.forEach((el) => { el.textContent = ''; });
    for (const el of els) {
      for (let i = 0; i <= el.dataset.full.length; i++) {
        if (token !== typeRun) return;
        el.textContent = el.dataset.full.slice(0, i);
        await new Promise((r) => setTimeout(r, 16 + Math.random() * 26));
      }
      await new Promise((r) => setTimeout(r, 220));
    }
  }

  /* ── scale-to-fit (present mode only) ── */
  // Scales the active slide's .inner (via transform, from center) to fill the
  // viewport, shrinking content that's too tall so it fits instead of overflowing.
  // Pairs with the base CSS: body.present .slide is flex-centered with overflow
  // hidden, and .inner has transform-origin: center.
  const FIT_MAX = 2;      // never zoom past 2x natural size
  const FIT_MIN = 0.5;    // never shrink below 0.5x
  const FIT_SIDE = 0.95;  // keep a little horizontal breathing room
  function fitSlide(s) {
    if (!s) return;
    const inner = $('.inner', s);
    if (!inner) return;
    if (mode !== 'present') { inner.style.transform = ''; return; }
    // Measure at full content size so the typing animation can't change the fit.
    const typed = $$('[data-type]', s);
    const savedText = typed.map((el) => el.textContent);
    typed.forEach((el) => { el.textContent = el.dataset.full || el.textContent; });
    const cw = inner.offsetWidth, ch = inner.offsetHeight;
    typed.forEach((el, i) => { el.textContent = savedText[i]; });
    const cs = getComputedStyle(s);
    const availW = s.clientWidth * FIT_SIDE;
    const availH = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    let scale = Math.min(availW / cw, availH / ch);
    scale = Math.max(FIT_MIN, Math.min(FIT_MAX, scale));
    inner.style.transform = Math.abs(scale - 1) < 0.005 ? '' : 'scale(' + scale.toFixed(4) + ')';
  }
  let fitRaf = 0;
  function scheduleFit() {
    if (mode !== 'present') return;
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => fitSlide(slides[cur]));
  }
  const toggleNotes = () => { document.body.classList.toggle('notes-open'); setTimeout(scheduleFit, 430); };
  addEventListener('resize', scheduleFit);
  document.addEventListener('fullscreenchange', () => setTimeout(scheduleFit, 60));

  /* ── present-mode activation ── */
  const counter = $('#counter'), progress = $('#progress');
  const npBody = $('#np-body'), npCount = $('#np-count');
  function activate(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, si) => {
      const active = si === cur;
      s.classList.toggle('active', active);
      if (!active) {
        $$('.rv, [data-step]', s).forEach((el) => el.classList.remove('in'));
        clearDelays(s);
      }
    });
    const s = slides[cur];
    fitSlide(s);
    $$('.rv, [data-step]', s).forEach((el) => el.classList.remove('in'));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('.rv', s).forEach((el) => el.classList.add('in'));
      s._steps.forEach((el, idx) => {
        el.style.transitionDelay = (.3 + idx * .09).toFixed(2) + 's';
        el.classList.add('in');
      });
    }));
    typeSlide(s);
    counter.innerHTML = '<b>' + String(cur + 1).padStart(2, '0') + '</b> / ' + String(slides.length).padStart(2, '0');
    progress.style.width = ((cur + 1) / slides.length * 100) + '%';
    history.replaceState(null, '', '#' + s.id);
    $('#btn-prev').disabled = cur === 0;
    $('#btn-next').disabled = cur === slides.length - 1;
    const talk = $('.talk', s);
    npBody.innerHTML = talk ? talk.innerHTML.replace(/<span class="ttag">[\s\S]*?<\/span>/, '') : '<p>No notes for this slide.</p>';
    npCount.textContent = (cur + 1) + ' / ' + slides.length;
    markMenu();
  }
  function next() { if (cur < slides.length - 1) go(cur + 1); }
  function prev() { if (cur > 0) go(cur - 1); }
  function go(i) {
    if (mode === 'present') activate(i);
    else slides[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ── read-mode observers ── */
  let io = null;
  function watchRead() {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          if (e.target.matches('.term') || $('[data-type]', e.target)) typeSlide(e.target.closest('.slide'));
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14 });
    $$('.rv, [data-step]').forEach((el) => io.observe(el));
  }
  function unwatchRead() { if (io) { io.disconnect(); io = null; } }

  let typedSlides = new WeakSet();
  const _typeSlide = typeSlide;
  typeSlide = (s) => {
    if (mode === 'read') {
      if (typedSlides.has(s)) return;
      typedSlides.add(s);
    }
    return _typeSlide(s);
  };

  /* ── scroll progress in read mode ── */
  function onScroll() {
    if (mode !== 'read') return;
    const h = document.documentElement;
    progress.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    let best = 0;
    slides.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .45) best = i; });
    cur = best;
    $('#btn-prev').disabled = cur === 0;
    $('#btn-next').disabled = cur === slides.length - 1;
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ── mode switching ── */
  const btnMode = $('#btn-mode'), btnNotes = $('#btn-notes'), btnFull = $('#btn-full');
  function setMode(m, keepPos) {
    mode = m;
    document.body.classList.toggle('present', m === 'present');
    document.body.classList.toggle('read', m === 'read');
    btnMode.innerHTML = m === 'present' ? 'Read <kbd>P</kbd>' : 'Present <kbd>P</kbd>';
    btnNotes.hidden = m !== 'present';
    btnFull.hidden = m !== 'present';
    // CUSTOMIZE: change 'deck-mode' to '<slug>-deck-mode'
    try { localStorage.setItem('deck-mode', m); } catch (e) {}
    if (m === 'present') {
      unwatchRead();
      typedSlides = new WeakSet();
      $$('.rv, [data-step]').forEach((el) => el.classList.remove('in'));
      activate(keepPos ? cur : 0);
    } else {
      document.body.classList.remove('notes-open');
      slides.forEach((s) => { s.classList.remove('active'); const inr = $('.inner', s); if (inr) inr.style.transform = ''; });
      $$('.rv, [data-step]').forEach((el) => el.classList.remove('in'));
      clearDelays();
      typedSlides = new WeakSet();
      watchRead();
      if (keepPos) setTimeout(() => slides[cur].scrollIntoView({ behavior: 'auto', block: 'start' }), 30);
      onScroll();
    }
  }
  btnMode.addEventListener('click', () => setMode(mode === 'present' ? 'read' : 'present', true));
  btnNotes.addEventListener('click', toggleNotes);
  $('#btn-menu').addEventListener('click', toggleMenu);
  btnFull.addEventListener('click', () => {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  });
  $('#btn-prev').addEventListener('click', prev);
  $('#btn-next').addEventListener('click', next);

  /* ── keyboard ── */
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'p') { setMode(mode === 'present' ? 'read' : 'present', true); return; }
    if (k === 'm') { toggleMenu(); return; }
    if (k === 'escape') { closeMenu(); return; }
    if (mode !== 'present') return;
    if (k === 'arrowright' || (k === ' ' && !e.shiftKey) || k === 'pagedown') { e.preventDefault(); next(); }
    else if (k === 'arrowleft' || (k === ' ' && e.shiftKey) || k === 'pageup') { e.preventDefault(); prev(); }
    else if (k === 'home') { e.preventDefault(); activate(0); }
    else if (k === 'end') { e.preventDefault(); activate(slides.length - 1); }
    else if (k === 'n') { toggleNotes(); }
    else if (k === 'f') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
  });

  /* ── boot: mode from ?mode= → localStorage → default read; slide from #hash ── */
  const qmode = new URLSearchParams(location.search).get('mode');
  let saved = null;
  // CUSTOMIZE: change 'deck-mode' to '<slug>-deck-mode'
  try { saved = localStorage.getItem('deck-mode'); } catch (e) {}
  const initial = (qmode === 'present' || qmode === 'read') ? qmode : (saved || 'read');
  const hashIdx = slides.findIndex((s) => '#' + s.id === location.hash);
  if (hashIdx > 0) cur = hashIdx;
  setMode(initial, hashIdx > 0);
})();
