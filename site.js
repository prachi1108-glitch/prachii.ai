(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ---- magnetic cursor (fine pointers only), ported from the Antigravity build ---- */
  if (matchMedia('(pointer: fine)').matches) {
    const dot = document.createElement('div'); dot.className = 'c-dot';
    const ring = document.createElement('div'); ring.className = 'c-ring';
    document.body.append(dot, ring); document.body.classList.add('has-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add('c-on');
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      ring.classList.toggle('hover', !!(e.target.closest && e.target.closest('a,button')));
    }, { passive: true });
    document.addEventListener('mouseleave', () => document.body.classList.remove('c-on'));
    (function loop() { rx += (mx - rx) * (reduce ? 1 : 0.18); ry += (my - ry) * (reduce ? 1 : 0.18);
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`; requestAnimationFrame(loop); })();
  }
  /* ---- copy email ---- */
  document.querySelectorAll('[data-copy]').forEach(btn => {
    const src = document.getElementById(btn.dataset.copy), label = btn.textContent;
    btn.addEventListener('click', () => {
      const done = () => { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = label, 1600); };
      const fallback = () => { const sel = getSelection(), rg = document.createRange(); rg.selectNodeContents(src); sel.removeAllRanges(); sel.addRange(rg); btn.textContent = 'Selected, press Ctrl+C'; };
      try { navigator.clipboard.writeText(src.textContent.trim()).then(done, fallback); } catch (e) { fallback(); }
    });
  });
})();
/* ---- Instagram reel player (official Instagram embed in a dialog) ---- */
(() => {
  const modal = document.getElementById('reelModal'); if (!modal) return;
  const frame = modal.querySelector('.reel-frame'), open = modal.querySelector('.reel-open');
  const close = () => { frame.innerHTML = ''; if (modal.open) modal.close(); };
  document.querySelectorAll('[data-reel]').forEach(btn => btn.addEventListener('click', () => {
    const code = btn.dataset.reel;
    frame.innerHTML = `<iframe src="https://www.instagram.com/reel/${code}/embed/" title="Instagram reel" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    open.href = `https://www.instagram.com/reel/${code}/`;
    document.body.classList.add('reel-open-now');
    if (modal.showModal) modal.showModal(); else window.open(open.href, '_blank');
  }));
  modal.querySelector('.reel-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.addEventListener('close', () => { frame.innerHTML = ''; document.body.classList.remove('reel-open-now'); });
})();
