/* "Information": every few seconds one letter fades to grey, cycles through a few characters, and settles back. */
(function () {
  var el = document.querySelector('.hero h1 .px');
  if (!el) return;
  var word = el.textContent;
  el.setAttribute('aria-label', word);
  el.textContent = '';
  var spans = word.split('').map(function (c) {
    var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); return s;
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var glyphs = '0123456789abcdefhkmnorstuxz', last = -1;
  function scramble() {
    var i; do { i = Math.floor(Math.random() * spans.length); } while (i === last); last = i;
    var s = spans[i], orig = word[i], steps = 6, n = 0;
    s.classList.add('live');
    var t = setInterval(function () {
      if (n++ < steps) { s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)]; }
      else { clearInterval(t); s.textContent = orig; s.classList.remove('live'); }
    }, 80);
  }
  setInterval(function () { if (!document.hidden) scramble(); }, 2800);
})();
