/* Jyothishakendram — interactions
   Vanilla JS. No framework dependencies.
*/

(function () {
  'use strict';

  /* ──────────────  LANGUAGE (EN / ML)  ──────────────
     All copy lives in the HTML twice (lang="en" / lang="ml"); CSS shows only
     the active one. JS handles the bits CSS can't: attributes (alt,
     placeholder, aria-label), <option> text, the page title, and strings
     this script writes itself.
  */
  const STR = {
    en: {
      title: 'Jyothishakendram · Sri Ramesh Panicker · Thrissur',
      menu: 'Menu', close: 'Close', openMenu: 'Open menu', closeMenu: 'Close menu',
      read: 'Read the full essay', collapse: 'Collapse the essay',
      play: 'Play introduction', pause: 'Pause introduction'
    },
    ml: {
      title: 'Jyothishakendram · ശ്രീ രമേഷ് പണിക്കർ · തൃശ്ശൂർ',
      menu: 'മെനു', close: 'അടയ്ക്കൂ', openMenu: 'മെനു തുറക്കുക', closeMenu: 'മെനു അടയ്ക്കുക',
      read: 'ലേഖനം മുഴുവൻ വായിക്കുക', collapse: 'ലേഖനം ചുരുക്കുക',
      play: 'ആമുഖം കേൾക്കുക', pause: 'ആമുഖം നിർത്തുക'
    }
  };
  const root = document.documentElement;
  let lang = root.getAttribute('data-lang') === 'en' ? 'en' : 'ml';
  const t = (k) => STR[lang][k];
  const langListeners = [];

  function swapLocalised() {
    ['alt', 'placeholder', 'aria-label'].forEach(attr => {
      document.querySelectorAll(`[data-ml-${attr}]`).forEach(el => {
        const enKey = `data-en-${attr}`;
        if (!el.hasAttribute(enKey)) el.setAttribute(enKey, el.getAttribute(attr) || '');
        el.setAttribute(attr, el.getAttribute(lang === 'ml' ? `data-ml-${attr}` : enKey));
      });
    });
    document.querySelectorAll('[data-ml-text]').forEach(el => {
      if (!el.hasAttribute('data-en-text')) el.setAttribute('data-en-text', el.textContent);
      el.textContent = el.getAttribute(lang === 'ml' ? 'data-ml-text' : 'data-en-text');
    });
  }

  function setLang(next, fromUser) {
    // Keep the reader's place: the two languages have different text lengths
    let anchor = null, before = 0;
    if (fromUser) {
      anchor = Array.from(document.querySelectorAll('main section[id]'))
        .find(s => s.getBoundingClientRect().bottom > 90);
      if (anchor) before = anchor.getBoundingClientRect().top;
    }

    lang = next === 'ml' ? 'ml' : 'en';
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    document.title = t('title');
    swapLocalised();
    document.querySelectorAll('[data-set-lang]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
    langListeners.forEach(fn => fn());

    if (anchor) {
      const delta = anchor.getBoundingClientRect().top - before;
      if (Math.abs(delta) > 1) window.scrollTo({ top: window.scrollY + delta, behavior: 'instant' });
    }
    if (fromUser) {
      try { sessionStorage.setItem('jk-lang', lang); } catch (_) {}
    }
  }

  // One address for the whole site: tidy away a leftover ?lang=… from older links
  try {
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) {
      u.searchParams.delete('lang');
      history.replaceState(null, '', u);
    }
  } catch (_) {}
  document.querySelectorAll('[data-set-lang]').forEach(b =>
    b.addEventListener('click', () => { if (b.dataset.setLang !== lang) setLang(b.dataset.setLang, true); }));

  /* Language hint strip — tap to flip the language; ✕ hides it for good */
  const stripBtn = document.getElementById('langStripBtn');
  const stripClose = document.getElementById('langStripClose');
  if (stripBtn) stripBtn.addEventListener('click', () => setLang(lang === 'ml' ? 'en' : 'ml', true));
  if (stripClose) stripClose.addEventListener('click', () => {
    root.classList.add('strip-closed');
    try { localStorage.setItem('jk-strip-closed', '1'); } catch (_) {}
  });

  /* ──────────────  MOBILE MENU  ────────────── */
  const menuBtn = document.getElementById('menuToggle');
  const mobMenu = document.getElementById('mobMenu');
  function setMenu(open) {
    mobMenu.classList.toggle('on', open);
    document.body.classList.toggle('menu-open', open);
    menuBtn.textContent = open ? t('close') : t('menu');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? t('closeMenu') : t('openMenu'));
  }
  langListeners.push(() => { if (menuBtn && mobMenu) setMenu(mobMenu.classList.contains('on')); });
  if (menuBtn && mobMenu) {
    menuBtn.addEventListener('click', () => setMenu(!mobMenu.classList.contains('on')));
    mobMenu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => setMenu(false))
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobMenu.classList.contains('on')) setMenu(false);
    });
    // If the viewport grows past the mobile breakpoint, close the menu
    const desktopMq = window.matchMedia('(min-width: 1181px)');
    const onMq = () => { if (desktopMq.matches) setMenu(false); };
    desktopMq.addEventListener ? desktopMq.addEventListener('change', onMq) : desktopMq.addListener(onMq);
  }

  /* ──────────────  SCROLL-SPY NAV  ────────────── */
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const navLinks = Array.from(document.querySelectorAll('nav.primary a'));
  const linkById = Object.fromEntries(
    navLinks.map(a => [a.getAttribute('href').slice(1), a])
  );
  function spy() {
    const y = window.scrollY + 140;
    let current = sections[0]?.id;
    for (const s of sections) {
      if (s.offsetTop <= y) current = s.id;
    }
    navLinks.forEach(a => a.classList.remove('active'));
    if (current && linkById[current]) linkById[current].classList.add('active');
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  /* ──────────────  ARTICLE EXPAND/COLLAPSE  ────────────── */
  document.querySelectorAll('[data-article]').forEach(body => {
    const btn = body.querySelector('.read');
    if (!btn) return;
    const sync = () => { btn.textContent = body.classList.contains('open') ? t('collapse') : t('read'); };
    langListeners.push(sync);
    btn.addEventListener('click', () => {
      const open = body.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      sync();
      // When collapsing a long essay on a phone, bring its heading back into view
      if (!open) body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ──────────────  LIGHTBOX  ────────────── */
  const lb = document.getElementById('lightbox');
  const lbFrame = document.getElementById('lbFrame');
  const lbClose = document.getElementById('lbClose');
  function openLb(html) {
    lbFrame.innerHTML = html;
    lb.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('on');
    lbFrame.innerHTML = '';
    document.body.style.overflow = '';
  }
  lbClose.addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === lbFrame) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });

  document.querySelectorAll('.tile, .honour-fig[data-image]').forEach(tile => {
    tile.addEventListener('click', () => {
      if (tile.dataset.video) {
        openLb(`<video src="${tile.dataset.video}" controls autoplay playsinline></video>`);
      } else if (tile.dataset.image) {
        const cap = (lang === 'ml' && tile.dataset.capMl) || tile.dataset.cap || '';
        openLb(
          `<img src="${tile.dataset.image}" alt="${cap}" />` +
          (cap ? `<div class="lb-cap">${cap}</div>` : '')
        );
      }
    });
  });

  // Gallery video previews — play on hover (mouse), or while in view (touch)
  const canHover = window.matchMedia('(hover: hover)').matches;
  document.querySelectorAll('.tile video').forEach(v => {
    const tile = v.closest('.tile');
    if (canHover) {
      tile.addEventListener('mouseenter', () => { v.play().catch(()=>{}); });
      tile.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) v.play().catch(()=>{});
          else v.pause();
        });
      }, { threshold: 0.6 }).observe(v);
    }
  });

  /* ──────────────  FORM  ────────────── */
  const formCard = document.getElementById('formCard');
  const form = document.getElementById('bookForm');
  if (form && formCard) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formCard.classList.add('sent');
      formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ──────────────  ACHARYA'S VOICE  ──────────────
     Waveform built from a synthetic envelope (because we cannot
     decode the file synchronously). Real-time playhead reflects the
     audio currentTime; flame amplitude is driven by a live analyser.
  */

  const audio    = document.getElementById('narrationAudio');
  const playBtn  = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const wave     = document.getElementById('wave');
  const curTime  = document.getElementById('curTime');
  const durTime  = document.getElementById('durTime');
  const flameWrap= document.getElementById('flameWrap');
  const lampHalo = document.getElementById('lampHalo');

  // --- Static bars (visual placeholder shape) ---
  const BARS = 84;
  const bars = [];
  for (let i = 0; i < BARS; i++) {
    const b = document.createElement('div');
    b.className = 'bar';
    // A gentle organic envelope: low at edges, undulating middle
    const t = i / (BARS - 1);
    const envelope = Math.sin(t * Math.PI) * 0.85 + 0.15;
    const noise = 0.55 + 0.45 * Math.sin(i * 1.7) * Math.cos(i * 0.6);
    const h = Math.max(0.18, envelope * (0.5 + 0.5 * noise));
    b.style.height = (h * 100) + '%';
    wave.appendChild(b);
    bars.push(b);
  }

  function fmt(t) {
    if (!isFinite(t)) return '—:—';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  audio.addEventListener('loadedmetadata', () => {
    durTime.textContent = fmt(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    const p = audio.currentTime / (audio.duration || 1);
    const idx = Math.floor(p * BARS);
    bars.forEach((b, i) => {
      b.classList.toggle('played', i < idx);
      b.classList.toggle('active', i === idx);
    });
    curTime.textContent = fmt(audio.currentTime);
    wave.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  });

  // Click / tap waveform to seek
  wave.addEventListener('click', (e) => {
    const rect = wave.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (audio.duration) audio.currentTime = Math.min(1, Math.max(0, ratio)) * audio.duration;
  });
  // Keyboard seek (the waveform is a role="slider")
  wave.addEventListener('keydown', (e) => {
    if (!audio.duration) return;
    if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
  });

  // --- Play/pause ---
  const ICON_PLAY  = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';

  let ac = null, analyser = null, src = null, dataArr = null, rafId = null;

  // Routing the <audio> element through Web Audio is only safe when the file is
  // same-origin over http(s). On file:// (opening index.html straight from disk)
  // or a cross-origin CDN without CORS, Chrome/Safari silently output ZEROES —
  // the audio "plays" but nothing is heard. In those cases we leave the element
  // alone and let the flame flicker synthetically instead.
  function canAnalyse() {
    if (!/^https?:$/.test(location.protocol)) return false;
    try {
      const u = new URL(audio.currentSrc || audio.src, location.href);
      return u.origin === location.origin || audio.crossOrigin != null;
    } catch (_) { return false; }
  }

  function ensureAudioGraph() {
    if (ac || !canAnalyse()) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
      analyser = ac.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      src = ac.createMediaElementSource(audio);
      src.connect(analyser);
      analyser.connect(ac.destination);
      dataArr = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      // Silently degrade — audio still plays via element
      console.warn('AudioContext unavailable; falling back to gentle flicker', err);
    }
  }

  function tickFlame() {
    let amp = 0;
    if (analyser) {
      analyser.getByteFrequencyData(dataArr);
      // Use lower-mid band for voice
      let sum = 0; const n = Math.min(40, dataArr.length);
      for (let i = 2; i < n; i++) sum += dataArr[i];
      amp = sum / (n * 255); // 0..1
      amp = Math.min(1, amp * 1.8);
    } else {
      // gentle synthetic pulse
      amp = 0.35 + 0.25 * Math.sin(performance.now() / 280);
    }
    flameWrap.style.setProperty('--amp', amp.toFixed(3));
    lampHalo.style.setProperty('--amp', amp.toFixed(3));
    rafId = requestAnimationFrame(tickFlame);
  }
  function stopTick() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    flameWrap.style.setProperty('--amp', '0');
    lampHalo.style.setProperty('--amp', '0');
  }

  playBtn.addEventListener('click', async () => {
    if (audio.paused) {
      ensureAudioGraph();
      if (ac && ac.state === 'suspended') { try { await ac.resume(); } catch (_) {} }
      try {
        await audio.play();
      } catch (err) {
        console.warn('Playback blocked:', err);
        return;
      }
      playIcon.innerHTML = ICON_PAUSE;
      playBtn.setAttribute('aria-label', t('pause'));
      tickFlame();
    } else {
      audio.pause();
      playIcon.innerHTML = ICON_PLAY;
      playBtn.setAttribute('aria-label', t('play'));
      stopTick();
    }
  });
  audio.addEventListener('ended', () => {
    playIcon.innerHTML = ICON_PLAY;
    playBtn.setAttribute('aria-label', t('play'));
    stopTick();
  });
  audio.addEventListener('pause', () => {
    if (audio.ended) return;
    playIcon.innerHTML = ICON_PLAY;
    playBtn.setAttribute('aria-label', t('play'));
    stopTick();
  });
  langListeners.push(() => playBtn.setAttribute('aria-label', audio.paused ? t('play') : t('pause')));

  /* Apply the initial language (set pre-paint in <head>) to JS-driven strings */
  setLang(lang, false);
})();
