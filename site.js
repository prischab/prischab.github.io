// Menu panel + top-bar ticker (live clocks alternating with status lines)
(function () {
  /* ---------- menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  var backdrop = document.querySelector('.menu-backdrop');

  if (btn && menu) {
    var page = location.pathname.split('/').pop() || 'index.html';
    menu.querySelectorAll('.menu-links a').forEach(function (a) {
      if (a.getAttribute('href') === page) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });

    var setOpen = function (open) {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.inert = !open;
    };
    setOpen(false);

    var closeBtn = menu.querySelector('.menu-close');
    btn.addEventListener('click', function () {
      setOpen(true);
      if (closeBtn) closeBtn.focus();
    });
    if (closeBtn) closeBtn.addEventListener('click', function () {
      setOpen(false);
      btn.focus();
    });
    if (backdrop) backdrop.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  /* ---------- optional images: remove any that fail to load ---------- */
  // A HEAD request up front means lazy images below the fold are dropped
  // before you scroll to them, so the layout doesn't jump.
  // With data-fallback="Name", the image is swapped for a .tile-type name block.
  // Exposed as window.prepOptionalImages(root) for content added later
  // (e.g. the case-study slides on the Projects page).
  var prepOptionalImages = function (root) {
    (root || document).querySelectorAll('img[data-optional]:not([data-opt-ready])').forEach(function (img) {
      // hidden project galleries are checked by projects.js only when a project opens
      if (img.closest('.proj-gallery')) return;
      img.setAttribute('data-opt-ready', '');
      var drop = function () {
        if (!img.parentNode) return;
        var name = img.getAttribute('data-fallback');
        if (name) {
          var fb = document.createElement('span');
          fb.className = 'tile-type';
          fb.textContent = name;
          img.replaceWith(fb);
        } else {
          img.remove();
        }
      };
      if (img.complete && img.naturalWidth === 0) return drop();
      img.addEventListener('error', drop);
      if (window.fetch && location.protocol.indexOf('http') === 0) {
        fetch(img.getAttribute('src'), { method: 'HEAD' })
          .then(function (r) { if (!r.ok) drop(); })
          .catch(function () {});
      }
    });
  };
  window.prepOptionalImages = prepOptionalImages;
  prepOptionalImages(document);

  /* ---------- cursor follower (mouse/trackpad only, off for reduced motion) ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (finePointer && !calm) {
    var dot = document.createElement('div');
    dot.className = 'cursor';
    dot.setAttribute('aria-hidden', 'true');
    dot.innerHTML = '<span></span>';
    document.body.appendChild(dot);

    var tx = -100, ty = -100, x = tx, y = ty, shown = false, running = false;
    // eases toward the mouse; stops itself once caught up so it never idles
    var step = function () {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      if (Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1) { x = tx; y = ty; running = false; }
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (running) requestAnimationFrame(step);
    };
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { x = tx; y = ty; shown = true; dot.classList.add('is-on'); }
      if (!running) { running = true; requestAnimationFrame(step); }
    });
    document.documentElement.addEventListener('mouseleave', function () {
      shown = false; dot.classList.remove('is-on');
    });
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      var link = t.closest('a, button, [role="button"]');
      var dark = t.closest('footer, .tile-type, .menu-links a, .pp-backdrop, .menu-backdrop');
      dot.classList.toggle('is-link', !!link);
      dot.classList.toggle('is-light', !!dark);
    });
  }

  /* ---------- ticker ---------- */
  var track = document.querySelector('.ticker-track');
  if (!track) return;

  var statuses = Array.prototype.map.call(track.querySelectorAll('span'), function (s) {
    return s.textContent;
  });
  var zones = [
    { city: 'Pune', tz: 'Asia/Kolkata', label: 'IST' },
    { city: 'Muscat', tz: 'Asia/Muscat', label: 'GST' }
  ];

  // One cycle alternates clock / status; its length is the LCM of both lists
  // so every clock meets every status and nothing repeats back-to-back.
  var gcd = function (a, b) { return b ? gcd(b, a % b) : a; };
  var n = statuses.length ? zones.length * statuses.length / gcd(zones.length, statuses.length) : zones.length;
  var unit = '';
  for (var i = 0; i < n; i++) {
    var z = zones[i % zones.length];
    unit += '<span data-tz="' + z.tz + '" data-label="' + (z.label || '') + '">' + z.city +
      ' <b class="time"></b><i class="tz"></i></span><span class="sep">/</span>';
    if (statuses.length) {
      unit += '<span>' + statuses[i % statuses.length] + '</span><span class="sep">/</span>';
    }
  }

  // Each half of the track must be at least as wide as the bar, or a gap shows
  // before the loop restarts. Repeat the cycle as needed, then double it for
  // the -50% marquee, and keep the speed constant (~40px/s).
  var bar = track.parentNode;
  var build = function () {
    track.innerHTML = unit;
    var unitW = track.scrollWidth || 1;
    var reps = Math.max(1, Math.ceil((bar.clientWidth + 1) / unitW));
    var half = new Array(reps + 1).join(unit);
    track.innerHTML = half + half;
    track.style.animationDuration = Math.round((unitW * reps) / 40) + 's';
  };
  build();
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { build(); clocks = track.querySelectorAll('[data-tz]'); tick(); }, 200);
  });

  var clocks = track.querySelectorAll('[data-tz]');
  var tick = function () {
    var now = new Date();
    clocks.forEach(function (el) {
      var tz = el.getAttribute('data-tz');
      el.querySelector('.time').textContent = now.toLocaleTimeString('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      var label = el.getAttribute('data-label');
      if (!label) {
        var part = new Intl.DateTimeFormat(tz === 'Europe/London' ? 'en-GB' : 'en-US', {
          timeZone: tz, timeZoneName: 'short'
        }).formatToParts(now).find(function (p) { return p.type === 'timeZoneName'; });
        label = part ? part.value : '';
      }
      el.querySelector('.tz').textContent = label;
    });
  };
  tick();
  setInterval(tick, 1000);
})();
