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
  document.querySelectorAll('img[data-optional]').forEach(function (img) {
    var drop = function () { img.remove(); };
    if (img.complete && img.naturalWidth === 0) return drop();
    img.addEventListener('error', drop);
    if (window.fetch && location.protocol.indexOf('http') === 0) {
      fetch(img.getAttribute('src'), { method: 'HEAD' })
        .then(function (r) { if (!r.ok) drop(); })
        .catch(function () {});
    }
  });

  /* ---------- ticker ---------- */
  var track = document.querySelector('.ticker-track');
  if (!track) return;

  var statuses = Array.prototype.map.call(track.querySelectorAll('span'), function (s) {
    return s.textContent;
  });
  var zones = [
    { city: 'Pune', tz: 'Asia/Kolkata', label: 'IST' },
    { city: 'Muscat', tz: 'Asia/Muscat', label: 'GST' },
    { city: 'London', tz: 'Europe/London' },
    { city: 'New York', tz: 'America/New_York' }
  ];

  var html = '';
  var count = Math.max(zones.length, statuses.length);
  for (var i = 0; i < count; i++) {
    var z = zones[i % zones.length];
    html += '<span data-tz="' + z.tz + '" data-label="' + (z.label || '') + '">' + z.city +
      ' <b class="time"></b><i class="tz"></i></span><span class="sep">/</span>';
    if (statuses.length) {
      html += '<span>' + statuses[i % statuses.length] + '</span><span class="sep">/</span>';
    }
  }
  track.innerHTML = html + html; // doubled so the -50% marquee loops seamlessly

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
