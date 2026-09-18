(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- keyboard shortcuts: letters shown in the [x] chips ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var a = document.querySelector('[data-key="' + e.key.toLowerCase() + '"]');
    if (a) { e.preventDefault(); a.click(); }
  });

  /* ---------- figure line-art: orbital shells ---------- */
  var figs = [].slice.call(document.querySelectorAll('canvas[data-fig]')).map(function (c) {
    return { c: c, g: c.getContext('2d'), kind: c.getAttribute('data-fig'), w: 0, h: 0 };
  });
  function sizeFigs() {
    figs.forEach(function (f) {
      var r = f.c.getBoundingClientRect();
      f.w = r.width; f.h = r.height;
      f.c.width = r.width * dpr; f.c.height = r.height * dpr;
      f.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }
  function drawFig(f, time) {
    var g = f.g, w = f.w, h = f.h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#2b2e36'; g.lineWidth = 0.8;
    if (f.kind === 'orbitals') {
      // six petals of nested shells, like a charge density plot
      for (var petal = 0; petal < 6; petal++) {
        var ang = petal * Math.PI / 3 + time * 0.00008;
        for (var s = 1; s <= 9; s++) {
          var k = s / 9, rx = R * 0.36 * k, ry = R * 0.15 * k;
          var ox = cx + Math.cos(ang) * R * 0.5, oy = cy + Math.sin(ang) * R * 0.5;
          g.beginPath();
          for (var a = 0; a <= 64; a++) {
            var th = a / 64 * 6.283, wob = 1 + 0.08 * Math.sin(th * 5 + s + time * 0.0006);
            var x = Math.cos(th) * rx * wob, y = Math.sin(th) * ry * wob;
            var X = ox + x * Math.cos(ang) - y * Math.sin(ang), Y = oy + x * Math.sin(ang) + y * Math.cos(ang);
            a ? g.lineTo(X, Y) : g.moveTo(X, Y);
          }
          g.stroke();
        }
      }
      g.beginPath(); g.arc(cx, cy, R * 0.06, 0, 6.283); g.stroke();
    } else {
      // a slow ribbon of field lines
      for (var i = 0; i < 26; i++) {
        g.beginPath();
        for (var x2 = 0; x2 <= w; x2 += 4) {
          var u = x2 / w, y2 = cy + Math.sin(u * 6 + i * 0.22 + time * 0.0004) * h * 0.18 * Math.sin(u * 3.1) + (i - 13) * 2.2;
          x2 ? g.lineTo(x2, y2) : g.moveTo(x2, y2);
        }
        g.stroke();
      }
    }
  }

  function frame(ts) {
        figs.forEach(function (f) { drawFig(f, ts); });
    raf = requestAnimationFrame(frame);
  }
  var raf = null;
  function start() { if (!reduce && !raf) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  sizeFigs(); figs.forEach(function (f) { drawFig(f, 0); }); start();
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { sizeFigs(); figs.forEach(function (f) { drawFig(f, 0); }); }, 150);
  });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
})();
