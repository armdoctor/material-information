/* Marina Bay line drawing, traced from a long-exposure view across the bay.
   Coordinates are in the reference photo's pixel space (1600 x 1067) and mapped to the canvas. */
(function () {
  var c = document.querySelector('canvas[data-fig="marina-bay"]');
  if (!c) return;
  var g = c.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var INK = '#2b2e36';
  var CROP = { x: 150, y: 95, w: 1320, h: 900 };
  var W, H, S, OX, OY, raf = null;

  function size() {
    var r = c.getBoundingClientRect();
    W = r.width; H = r.height;
    c.width = W * dpr; c.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.min(W / CROP.w, H / CROP.h);
    OX = (W - CROP.w * S) / 2 - CROP.x * S;
    OY = (H - CROP.h * S) / 2 - CROP.y * S;
  }
  function X(x) { return OX + x * S; }
  function Y(y) { return OY + y * S; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function line(pts, w, a) {
    g.globalAlpha = a == null ? 1 : a; g.lineWidth = w || 0.7;
    g.beginPath();
    for (var i = 0; i < pts.length; i++) i ? g.lineTo(X(pts[i][0]), Y(pts[i][1])) : g.moveTo(X(pts[i][0]), Y(pts[i][1]));
    g.stroke(); g.globalAlpha = 1;
  }
  function qb(p0, p1, p2, n) {           // quadratic bezier as points
    var o = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t;
      o.push([a * p0[0] + b * p1[0] + d * p2[0], a * p0[1] + b * p1[1] + d * p2[1]]);
    }
    return o;
  }

  /* ---------- SkyPark: a long hull, pointed cantilever to the left ---------- */
  function hullTop(x) { return lerp(150, 226, (x - 300) / 890); }
  function hullTh(x) { var u = (x - 300) / 150; return u < 1 ? 10 + 32 * Math.sqrt(Math.max(0, u)) : 42; }
  function hullBottom(x) { return hullTop(x) + hullTh(x); }

  function skypark(t) {
    for (var k = 0; k <= 6; k++) {
      var pts = [];
      for (var x = 300; x <= 1180; x += 10) pts.push([x, hullTop(x) + hullTh(x) * (k / 6)]);
      // rounded end on the right
      var yT = hullTop(1180), th = hullTh(1180);
      pts.push([1188, yT + th * (k / 6) + (k > 3 ? -2 : 1)]);
      line(pts, (k === 0 || k === 6) ? 1.1 : 0.45, (k === 0 || k === 6) ? 1 : 0.7);
    }
    line([[1180, hullTop(1180)], [1192, hullTop(1180) + 18], [1180, hullBottom(1180)]], 1.1);
    // rooftop blocks
    line([[498, hullTop(498)], [498, hullTop(498) - 14], [570, hullTop(570) - 14], [570, hullTop(570)]], 0.9);
    line([[1045, hullTop(1045)], [1045, hullTop(1045) - 13], [1102, hullTop(1102) - 13], [1102, hullTop(1102)]], 0.9);
    // palms on the deck, swaying
    for (var p = 0; p < 22; p++) {
      var px = lerp(610, 1150, p / 21), base = hullTop(px), sw = Math.sin(t * 0.0011 + p * 1.7) * 2;
      line([[px, base], [px + sw, base - 12]], 0.6);
      g.beginPath(); g.arc(X(px + sw), Y(base - 15), 4 * S, 0, 6.283); g.lineWidth = 0.6; g.stroke();
    }
  }

  /* ---------- Towers: glass slabs with a splayed outer leg ---------- */
  var TOWERS = [[458, 657], [735, 925], [1000, 1195]];
  var BASE = 625, SPLIT = 470;
  function towers(t) {
    TOWERS.forEach(function (tw, ti) {
      var xl = tw[0], xr = tw[1], wid = xr - xl;
      var top = Math.min(hullBottom(xl), hullBottom(xr));
      // both faces bow: the slab swells slightly to the left through its middle and tucks in at the base
      function bow(y) { var v = Math.max(0, Math.min(1, (y - top) / (BASE - top))); return Math.sin(Math.PI * v * 0.9); }
      function left(y) {
        var x = xl - 16 * bow(y);
        if (y > SPLIT) x = lerp(xl - 16 * bow(SPLIT), xl + wid * 0.2, (y - SPLIT) / (BASE - SPLIT));
        return x;
      }
      function right(y) { return xr - 9 * bow(y) + 4 * Math.pow(Math.max(0, (y - top) / (BASE - top)), 2); }
      function edge(fn, y0, y1) { var p = []; for (var y = y0; y <= y1; y += 8) p.push([fn(y), y]); p.push([fn(y1), y1]); return p; }
      // outline
      line(edge(left, hullBottom(xl), BASE), 1.1);
      line(edge(right, hullBottom(xr), BASE), 1.1);
      // splayed outer leg continuing the curve outward
      var lx = xl - 16 * bow(SPLIT);
      line(qb([lx, SPLIT], [lx - 8, SPLIT + 80], [lx - 24, BASE], 16), 1.1);
      // curved mullions, with a slow band of light travelling up them
      var n = 22;
      for (var i = 1; i < n; i++) {
        var k = i / n, pts = [];
        for (var y = top; y <= BASE; y += 6) {
          var x = lerp(left(y), right(y), k);
          if (y >= hullBottom(x) - 1) pts.push([x, y]);
        }
        g.setLineDash([6 * S, 5 * S]);
        g.lineDashOffset = -(t * 0.012 + i * 3 + ti * 11) * S;
        line(pts, 0.45, 0.55 + 0.35 * Math.sin(i * 0.9 + ti));
      }
      g.setLineDash([]);
      // floor lines follow the bowed faces
      for (var f = 0; f < 9; f++) {
        var fy = lerp(hullBottom(xr) + 30, BASE - 20, f / 8);
        line([[left(fy), fy], [right(fy), fy]], 0.35, 0.35);
      }
    });
  }

  /* ---------- ArtScience Museum: a crescent petal and a cup of lower petals ---------- */
  function fillPoly(pts) {
    g.beginPath();
    pts.forEach(function (p, i) { i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])); });
    g.closePath(); g.fillStyle = '#fbfcfd'; g.fill();
  }
  function museum(t) {
    var breathe = Math.sin(t * 0.0008) * 3;
    var outer = qb([346, 448], [288 + breathe, 600], [440, 705], 30);
    var inner = qb([346, 448], [400 + breathe * 0.5, 570], [470, 600], 30);
    var stem = [545, 712];
    var rim = [[440, 596], [470, 590], [520, 606], [590, 596], [645, 606], [700, 594], [735, 603], [755, 594]];
    // paper-white body so the towers behind stay hidden
    fillPoly(outer.concat(inner.slice().reverse()));
    fillPoly(rim.concat([[680, 690], stem, [470, 700], [440, 705]]));
    // the tall crescent
    for (var k = 0; k <= 12; k++) {
      var pts = outer.map(function (p, i) { return [lerp(p[0], inner[i][0], k / 12), lerp(p[1], inner[i][1], k / 12)]; });
      line(pts, (k === 0 || k === 12) ? 1.1 : 0.45, (k === 0 || k === 12) ? 1 : 0.75);
    }
    // lower petals: panels converging on the stem, rim scalloped between petal tips
    line(rim, 1.1);
    for (var i = 0; i < rim.length; i++) {
      var p = rim[i];
      line(qb(p, [lerp(p[0], stem[0], 0.5), lerp(p[1], stem[1], 0.5) + 18], stem, 14), i % 2 ? 0.45 : 0.9, i % 2 ? 0.6 : 1);
    }
    // contour bands across the cup, drifting slowly downward
    for (var k2 = 1; k2 <= 6; k2++) {
      var f = ((k2 / 7) + t * 0.00004) % 1;
      var band = rim.map(function (p) { return [lerp(p[0], stem[0], f), lerp(p[1], stem[1], f) + Math.sin(f * 3.1) * 10]; });
      line(band, 0.45, 0.6 * (1 - f) + 0.2);
    }
    // windows in the three upper petals
    [[468, 520], [592, 645], [700, 735]].forEach(function (w) {
      line([[w[0] + 6, 603], [w[1] - 6, 603], [w[1] - 9, 618], [w[0] + 9, 618], [w[0] + 6, 603]], 0.7);
    });
    line([[515, 712], [505, 775]], 0.9); line([[572, 712], [582, 775]], 0.9);
  }

  /* ---------- Waterfront: low roofs, masts and cables, promenade ---------- */
  function waterfront() {
    [[140, 420, 690], [690, 905, 688], [985, 1265, 686], [1270, 1470, 662]].forEach(function (r) {
      line([[r[0], r[2]], [r[1], r[2] - 6]], 1);
      line([[r[0] + 8, r[2] + 8], [r[1] - 6, r[2] + 2]], 0.5, 0.7);
    });
    [[300, 620, 690], [805, 615, 688], [1262, 610, 662]].forEach(function (m) {
      line([[m[0], m[1]], [m[0], m[2]]], 0.9);
      for (var k = -3; k <= 3; k++) if (k) line([[m[0], m[1] + 4], [m[0] + k * 32, m[2]]], 0.4, 0.7);
    });
    // domed shopping arcade on the right
    for (var k = 0; k < 4; k++) line(qb([1360 + k * 40, 660], [1400 + k * 40, 612], [1440 + k * 40, 640], 12), 0.6);
    // promenade and waterline
    line([[140, 780], [1470, 772]], 1.1);
    line([[140, 792], [1470, 784]], 0.6, 0.7);
    line([[140, 806], [1470, 800]], 1.1);
  }

  /* ---------- Water: ripples, with the towers' reflections as vertical bands ---------- */
  function water(t) {
    var bands = TOWERS.map(function (tw) { return [tw[0] + 10, tw[1] - 5]; }).concat([[330, 470]]);
    for (var y = 822; y < CROP.y + CROP.h; y += 9) {
      var depth = (y - 822) / (CROP.y + CROP.h - 822);
      var amp = 1 + depth * 3, sp = 0.0007 + depth * 0.0005;
      for (var x = CROP.x; x < CROP.x + CROP.w; x += 14) {
        var y1 = y + Math.sin(x * 0.02 + t * sp + y) * amp;
        var y2 = y + Math.sin((x + 14) * 0.02 + t * sp + y) * amp;
        var inBand = bands.some(function (b) { return x > b[0] && x < b[1]; });
        if ((x / 14 + y / 9) % (inBand ? 5 : 3) < 1) continue;   // gaps read as open water
        line([[x, y1], [x + 12, y2]], inBand ? 0.7 : 0.5, inBand ? 0.6 - depth * 0.3 : 0.22 + (1 - depth) * 0.12);
      }
    }
  }

  function draw(t) {
    g.clearRect(0, 0, W, H);
    g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
    waterfront(); towers(t); skypark(t); museum(t); water(t);
  }
  function frame(t) { draw(t); raf = requestAnimationFrame(frame); }
  function start() { if (!reduce && !raf) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  size(); draw(0); start();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(0); }, 150); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
})();
