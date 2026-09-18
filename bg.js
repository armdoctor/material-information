(function () {
  var canvas = document.createElement('canvas');
  canvas.id = 'field';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, P = [], t = 0, raf = null;

  function seed() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(170, Math.round(W * H / 8500));
    P = [];
    for (var i = 0; i < n; i++) {
      var depth = Math.random();               // 0 = far, 1 = near
      P.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.6 + depth * 1.6,
        a: 0.18 + depth * 0.42,
        vx: (Math.random() - 0.5) * 0.12, vy: -0.04 - depth * 0.12,
        ph: Math.random() * Math.PI * 2, f: 0.004 + Math.random() * 0.01,
        amp: 0.15 + depth * 0.35
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // faint bonds between nearby electrons
    for (var i = 0; i < P.length; i++) {
      for (var j = i + 1; j < P.length; j++) {
        var dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d2 = dx * dx + dy * dy;
        if (d2 < 7000) {
          ctx.strokeStyle = 'rgba(36,70,201,' + (0.07 * (1 - d2 / 7000)).toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke();
        }
      }
    }
    for (var k = 0; k < P.length; k++) {
      var p = P[k];
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, 'rgba(36,70,201,' + p.a + ')');
      g.addColorStop(0.35, 'rgba(64,110,240,' + (p.a * 0.35) + ')');
      g.addColorStop(1, 'rgba(64,110,240,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  function step() {
    t++;
    for (var k = 0; k < P.length; k++) {
      var p = P[k];
      p.x += p.vx + Math.sin(t * p.f + p.ph) * p.amp;
      p.y += p.vy + Math.cos(t * p.f * 0.8 + p.ph) * p.amp * 0.5;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function start() { if (!reduce && !raf) raf = requestAnimationFrame(step); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  seed(); draw(); start();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { seed(); draw(); }, 150); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
})();
