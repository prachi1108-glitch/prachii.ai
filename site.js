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
/* ---- Live feeds (Instagram + LinkedIn) and the post player ---- */
(() => {
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const bust = '?v=' + new Date().toISOString().slice(0, 10);

  const ig = document.querySelector('[data-feed="instagram"]');
  if (ig) fetch('feed-instagram.json' + bust).then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !d.reels || !d.reels.length) return;
    const card = (r, dup) => `<li><button class="reel" type="button" data-reel="${esc(r.code)}"${dup ? ' aria-hidden="true" tabindex="-1"' : ''} aria-label="Play reel: ${esc(r.caption)}"><img src="ig-${esc(r.code)}.webp" alt="" loading="lazy" width="360" height="640"><span class="reel-play">${PLAY}</span><span class="reel-cap">${esc(r.caption)}</span></button></li>`;
    ig.innerHTML = d.reels.map(r => card(r)).join('') + d.reels.map(r => card(r, true)).join('');
  }).catch(() => {});

  const li = document.querySelector('[data-feed="linkedin"]');
  if (li) fetch('feed-linkedin.json' + bust).then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !d.posts || !d.posts.length) return;
    li.innerHTML = d.posts.slice(0, 3).map(p => `<li><button class="li-card${p.image ? ' has-img' : ''}" type="button" data-li="${esc(p.id)}" aria-label="Read LinkedIn post from ${fmt(p.date)}">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}<span class="li-date">${fmt(p.date)}</span><span class="li-text">${esc(p.text)}</span><span class="li-more">Read on LinkedIn ↗</span></button></li>`).join('');
  }).catch(() => {});

  const modal = document.getElementById('reelModal'); if (!modal) return;
  const frame = modal.querySelector('.reel-frame'), open = modal.querySelector('.reel-open');
  const show = (src, href, label, kind) => {
    frame.innerHTML = `<iframe src="${src}" title="${label}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    open.href = href; open.textContent = label + ' ↗'; modal.dataset.kind = kind;
    document.body.classList.add('reel-open-now');
    if (modal.showModal) modal.showModal(); else window.open(href, '_blank');
  };
  document.addEventListener('click', e => {
    const r = e.target.closest && e.target.closest('[data-reel]');
    if (r) return show(`https://www.instagram.com/reel/${r.dataset.reel}/embed/`, `https://www.instagram.com/reel/${r.dataset.reel}/`, 'Open on Instagram', 'ig');
    const l = e.target.closest && e.target.closest('[data-li]');
    if (l) return show(`https://www.linkedin.com/embed/feed/update/urn:li:activity:${l.dataset.li}`, `https://www.linkedin.com/feed/update/urn:li:activity:${l.dataset.li}/`, 'Open on LinkedIn', 'li');
  });
  const close = () => { frame.innerHTML = ''; if (modal.open) modal.close(); };
  modal.querySelector('.reel-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.addEventListener('close', () => { frame.innerHTML = ''; document.body.classList.remove('reel-open-now'); });
})();
