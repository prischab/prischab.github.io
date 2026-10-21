// Projects page: clicking a grid card (or a strip tile) opens a centred modal.
// Left: an image gallery built from the card's hidden .proj-gallery (or its
// main image). Right: the card's <template class="cs"> slides as a short case
// study, or the card text if there are no slides.
(function () {
  var cards = document.querySelectorAll('.proj-grid .project');
  if (!cards.length) return;

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  var backdrop = document.createElement('div');
  backdrop.className = 'pp-backdrop';
  var panel = document.createElement('aside');
  panel.className = 'pp';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Project details');
  panel.innerHTML =
    '<button class="menu-close" type="button" aria-label="Close project"><span></span><span></span></button>' +
    '<div class="pp-gallery" role="region" aria-label="Project images"></div>' +
    '<div class="pp-text"></div>';
  var lb = document.createElement('button');
  lb.type = 'button';
  lb.className = 'lb';
  lb.hidden = true;
  lb.setAttribute('aria-label', 'Close full-screen image');
  lb.innerHTML = '<img alt="">';
  body.appendChild(backdrop);
  body.appendChild(panel);
  body.appendChild(lb);
  panel.inert = true;

  var galEl = panel.querySelector('.pp-gallery');
  var content = panel.querySelector('.pp-text');
  var closeBtn = panel.querySelector('.menu-close');
  var lbImg = lb.querySelector('img');
  var lastFocus = null;
  var deck = null; // case-study slides state while open
  var gal = null;  // gallery state while open
  var token = 0;   // ignores gallery checks that finish after another project opened

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  // ---------- image existence checks (cached, so reopening is instant) ----------
  var exists = {};
  function probe(src) {
    if (!exists[src]) {
      exists[src] = new Promise(function (resolve) {
        var im = new Image();
        im.onload = function () { resolve(im.naturalWidth > 0); };
        im.onerror = function () { resolve(false); };
        im.src = src;
      });
    }
    return exists[src];
  }
  function candidates(card) {
    var list = card.querySelectorAll('.proj-gallery img');
    if (!list.length) list = card.querySelectorAll('.proj-media img');
    return Array.prototype.map.call(list, function (i) {
      return { src: i.getAttribute('src'), alt: i.getAttribute('alt') || '' };
    });
  }
  function warm(card) { candidates(card).forEach(function (c) { probe(c.src); }); }

  // ---------- gallery ----------
  function renderGallery(card, title) {
    var t = ++token;
    gal = null;
    galEl.className = 'pp-gallery';
    galEl.innerHTML = '<div class="g-stage is-loading"></div>';
    var c = candidates(card);
    Promise.all(c.map(function (x) { return probe(x.src); })).then(function (ok) {
      if (t !== token) return;
      buildGallery(c.filter(function (x, k) { return ok[k]; }), title);
    });
  }

  function buildGallery(imgs, title) {
    galEl.innerHTML = '';
    var stage = document.createElement('div');
    stage.className = 'g-stage';
    galEl.appendChild(stage);

    if (!imgs.length) { // nothing exists yet: show the name block, like the grid does
      galEl.classList.add('is-single', 'is-empty');
      var fb = document.createElement('span');
      fb.className = 'tile-type';
      fb.textContent = title;
      stage.appendChild(fb);
      return;
    }
    galEl.classList.toggle('is-single', imgs.length === 1);

    stage.innerHTML =
      '<button class="g-zoom" type="button" aria-label="View image full screen"><img class="g-main" alt=""></button>' +
      '<button class="g-arrow g-prev" type="button" aria-label="Previous image">‹</button>' +
      '<button class="g-arrow g-next" type="button" aria-label="Next image">›</button>' +
      '<span class="g-count" aria-live="polite"></span>';

    var thumbs = document.createElement('div');
    thumbs.className = 'g-thumbs';
    var tb = imgs.map(function (x, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'g-thumb';
      b.setAttribute('aria-label', 'Show image ' + (k + 1));
      var im = document.createElement('img');
      im.alt = '';
      im.loading = 'lazy';
      im.src = x.src;
      b.appendChild(im);
      b.addEventListener('click', function () { gGo(k); });
      thumbs.appendChild(b);
      return b;
    });
    galEl.appendChild(thumbs);

    gal = { imgs: imgs, i: 0, main: stage.querySelector('.g-main'), count: stage.querySelector('.g-count'), thumbs: tb };
    stage.querySelector('.g-prev').addEventListener('click', function () { gGo(gal.i - 1); });
    stage.querySelector('.g-next').addEventListener('click', function () { gGo(gal.i + 1); });
    stage.querySelector('.g-zoom').addEventListener('click', openLb);
    addSwipe(stage, function (dir) { gGo(gal.i + dir); });
    gGo(0);
  }

  function gGo(i) {
    if (!gal) return;
    var n = gal.imgs.length;
    i = ((i % n) + n) % n; // wraps around
    gal.i = i;
    gal.main.src = gal.imgs[i].src;
    gal.main.alt = gal.imgs[i].alt;
    gal.count.textContent = (i + 1) + ' / ' + n;
    gal.thumbs.forEach(function (b, k) {
      if (k === i) {
        b.setAttribute('aria-current', 'true');
        if (b.scrollIntoView && b.parentNode.scrollWidth > b.parentNode.clientWidth) {
          b.parentNode.scrollLeft = b.offsetLeft - b.parentNode.clientWidth / 2 + b.clientWidth / 2;
        }
      } else {
        b.removeAttribute('aria-current');
      }
    });
    if (!lb.hidden) { lbImg.src = gal.imgs[i].src; lbImg.alt = gal.imgs[i].alt; }
  }

  function openLb() {
    if (!gal) return;
    lbImg.src = gal.imgs[gal.i].src;
    lbImg.alt = gal.imgs[gal.i].alt;
    lb.hidden = false;
    lb.focus({ preventScroll: true });
  }
  function closeLb() {
    if (lb.hidden) return;
    lb.hidden = true;
    var z = galEl.querySelector('.g-zoom');
    if (z) z.focus({ preventScroll: true });
  }
  lb.addEventListener('click', closeLb);

  // horizontal swipe on touch screens; vertical scrolls and tiny drags are ignored
  function addSwipe(el, onSwipe) {
    var sx = 0, sy = 0;
    el.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) onSwipe(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  // ---------- case-study slides ----------
  function go(i) {
    if (!deck) return;
    var n = deck.slides.length;
    i = Math.max(0, Math.min(n - 1, i));
    deck.i = i;
    deck.slides.forEach(function (s, k) {
      var on = k === i;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
      s.inert = !on;
    });
    deck.dots.forEach(function (d, k) {
      if (k === i) d.setAttribute('aria-current', 'step');
      else d.removeAttribute('aria-current');
    });
    deck.count.textContent = pad(i + 1) + ' / ' + pad(n);
    deck.prev.disabled = i === 0;
    deck.next.disabled = i === n - 1;
  }

  function buildDeck(card, tpl) {
    var cardBody = card.querySelector('.proj-body');

    // header: number, badge, title, stack — the card text minus description + links
    if (cardBody) {
      var head = cardBody.cloneNode(true);
      head.querySelectorAll('p, .proj-links').forEach(function (el) { el.remove(); });
      head.classList.add('cs-head');
      content.appendChild(head);
    }

    var slides = Array.prototype.map.call(tpl.content.querySelectorAll('.cs-slide'), function (s) {
      var c = s.cloneNode(true);
      c.querySelectorAll('img').forEach(function (im) { im.remove(); }); // screenshots live in the gallery
      return c;
    });
    if (!slides.length) return false;

    // the card's external links go on the last slide (internship "Read more" links are dropped)
    var links = cardBody && cardBody.querySelector('.proj-links');
    if (links) {
      var l = links.cloneNode(true);
      l.querySelectorAll('a[href^="experience.html"]').forEach(function (a) { a.remove(); });
      if (l.querySelector('a')) slides[slides.length - 1].appendChild(l);
    }

    var wrap = document.createElement('div');
    wrap.className = 'cs-deck';
    slides.forEach(function (s, k) {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slide');
      s.setAttribute('aria-label', (k + 1) + ' of ' + slides.length);
      wrap.appendChild(s);
    });

    var nav = document.createElement('div');
    nav.className = 'cs-nav';
    nav.innerHTML =
      '<button class="cs-btn cs-prev" type="button">← Prev</button>' +
      '<div class="cs-mid"><span class="cs-count" aria-live="polite"></span><div class="cs-dots"></div></div>' +
      '<button class="cs-btn cs-next" type="button">Next →</button>';
    var dotsBox = nav.querySelector('.cs-dots');
    var dots = slides.map(function (s, k) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'cs-dot';
      d.setAttribute('aria-label', 'Go to slide ' + (k + 1));
      d.addEventListener('click', function () { go(k); });
      dotsBox.appendChild(d);
      return d;
    });

    content.appendChild(wrap);
    content.appendChild(nav);

    deck = {
      slides: slides, dots: dots, i: 0,
      count: nav.querySelector('.cs-count'),
      prev: nav.querySelector('.cs-prev'),
      next: nav.querySelector('.cs-next')
    };
    deck.prev.addEventListener('click', function () { go(deck.i - 1); });
    deck.next.addEventListener('click', function () { go(deck.i + 1); });
    addSwipe(wrap, function (dir) { go(deck.i + dir); });
    go(0);
    return true;
  }

  // ---------- open / close ----------
  function open(card) {
    content.innerHTML = '';
    deck = null;
    var h3 = card.querySelector('h3');
    var title = h3 ? h3.textContent : 'Project';
    renderGallery(card, title);

    var tpl = card.querySelector('template.cs');
    if (!tpl || !buildDeck(card, tpl)) {
      content.innerHTML = '';
      var cardBody = card.querySelector('.proj-body');
      if (cardBody) content.appendChild(cardBody.cloneNode(true));
    }
    panel.setAttribute('aria-label', title);
    panel.scrollTop = 0;
    content.scrollTop = 0;
    lastFocus = card;
    body.classList.add('pp-open');
    panel.inert = false;
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (!body.classList.contains('pp-open')) return;
    lb.hidden = true;
    body.classList.remove('pp-open');
    panel.inert = true;
    deck = null;
    token++; // drop any gallery check still in flight
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // keep Tab inside the modal while it's open
  function trapTab(e) {
    var f = Array.prototype.filter.call(
      panel.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.closest('[inert]') && el.getClientRects().length; }
    );
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  cards.forEach(function (card) {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-haspopup', 'dialog');
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      open(card);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
    });
    card.addEventListener('pointerenter', function () { warm(card); });
  });

  // filter buttons: show only cards whose data-tags include the chosen filter
  var buttons = document.querySelectorAll('.filters button');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      cards.forEach(function (card) {
        var show = f === 'all' || (card.getAttribute('data-tags') || '').split(' ').indexOf(f) !== -1;
        card.hidden = !show;
        card.classList.remove('is-shown');
        if (show) { void card.offsetWidth; card.classList.add('is-shown'); }
      });
    });
  });

  // strip tiles: scroll to the card and open it (clearing a filter that hides it)
  document.querySelectorAll('.strip .tile').forEach(function (tile) {
    var card = document.getElementById(tile.getAttribute('href').slice(1));
    if (!card) return;
    tile.addEventListener('pointerenter', function () { warm(card); });
    tile.addEventListener('click', function (e) {
      e.preventDefault();
      if (card.hidden) {
        var all = document.querySelector('.filters [data-filter="all"]');
        if (all) all.click();
        else card.hidden = false;
      }
      card.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
      open(card);
    });
  });

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (!body.classList.contains('pp-open')) return;
    if (!lb.hidden) { // full-screen image is on top
      if (e.key === 'Escape') { e.preventDefault(); closeLb(); }
      else if (e.key === 'ArrowRight' && gal) { e.preventDefault(); gGo(gal.i + 1); }
      else if (e.key === 'ArrowLeft' && gal) { e.preventDefault(); gGo(gal.i - 1); }
      else if (e.key === 'Tab') { e.preventDefault(); }
      return;
    }
    if (e.key === 'Escape') return close();
    if (e.key === 'Tab') return trapTab(e);
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var dir = e.key === 'ArrowRight' ? 1 : -1;
    // arrows drive the gallery when focus is in it; otherwise the slides
    if (gal && (galEl.contains(document.activeElement) || !deck)) { e.preventDefault(); gGo(gal.i + dir); }
    else if (deck) { e.preventDefault(); go(deck.i + dir); }
  });

  // First screen = heading + strip: on tall screens, the spare height goes ABOVE the
  // strip so it sits along the bottom edge; filters follow right after on scroll.
  // Tile size is not touched.
  var strip = document.querySelector('.strip');
  function seatStrip() {
    if (!strip) return;
    strip.style.marginTop = '';
    var r = strip.getBoundingClientRect();
    var bottom = r.bottom + window.scrollY;
    var spare = window.innerHeight - bottom - 24;
    if (spare > 0) strip.style.marginTop = (24 + spare) + 'px';
  }
  seatStrip();
  window.addEventListener('load', seatStrip);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(seatStrip);
  setTimeout(seatStrip, 1000);
  var seatTimer;
  window.addEventListener('resize', function () { clearTimeout(seatTimer); seatTimer = setTimeout(seatStrip, 150); });

  // deep link: work.html#vaani-proj opens that project
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('project')) open(target);
  }
})();
