(() => {
  const FRAMES = 64, SRC_W = 1920, SRC_H = 1080, FACE_X = 960, FACE_Y = 480;
  const LERP = 0.26, DEADZONE = 0.12;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('face');
  const ctx = canvas.getContext('2d', { alpha: false });
  const nameL = document.getElementById('nameL'), nameR = document.getElementById('nameR');
  const hi = document.getElementById('hi'), watching = document.getElementById('watching');

  /* ---- preload frames ---- */
  const imgs = new Array(FRAMES); let center = null, loaded = 0; const total = FRAMES + 1;
  const bar = document.getElementById('bar'), pct = document.getElementById('pct'), loader = document.getElementById('loader');
  const tick = () => { loaded++; const p = Math.round(loaded / total * 100); bar.style.width = p + '%'; pct.textContent = 'Loading ' + p + '%';
    if (loaded >= total) { loader.classList.add('done'); dirty = true; } };
  const c = new Image(); c.onload = () => { center = c; tick(); }; c.onerror = tick; c.src = 'center.webp';
  for (let i = 0; i < FRAMES; i++) { const im = new Image(); im.onload = () => { imgs[i] = im; tick(); }; im.onerror = tick; im.src = i + '.webp'; }

  /* ---- pointer ---- */
  let mx = innerWidth / 2, my = innerHeight / 2;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  addEventListener('touchmove', e => { if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; } }, { passive: true });

  /* ---- geometry: object-fit cover, same maths as the Antigravity build ---- */
  let geo = null, dirty = true;
  function layout() {
    const r = stage.getBoundingClientRect(), W = r.width, H = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const ir = SRC_W / SRC_H; let dw, dh, dx, dy;
    if (W / H > ir) { dw = W; dh = W / ir; dx = 0; dy = (H - dh) / 2; } else { dh = H; dw = H * ir; dx = (W - dw) / 2; dy = 0; }
    geo = { W, H, dpr, dw, dh, dx, dy, fx: dx + FACE_X / SRC_W * dw, fy: dy + FACE_Y / SRC_H * dh };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#f9f3f0'; ctx.fillRect(0, 0, W, H);
    placeName(); dirty = true;
  }

  /* split the name around her face; multiply-blend tucks it behind her hair */
  function placeName() {
    const g = geo; if (getComputedStyle(nameL).display === 'none') return;
    const gutter = Math.max(16, innerWidth * 0.04);
    const inner = 0.145 * g.dw;              // distance from face centre to where each half ends
    let fs = 0.175 * g.dw;
    nameL.style.fontSize = nameR.style.fontSize = fs + 'px';
    const availL = g.fx - inner - gutter, availR = g.W - (g.fx + inner) - gutter;
    const k = Math.min(1, availL / nameL.offsetWidth, availR / nameR.offsetWidth);
    fs *= k; nameL.style.fontSize = nameR.style.fontSize = fs + 'px';
    const top = g.fy - fs * 0.42;
    nameL.style.transform = `translate(${g.fx - inner - nameL.offsetWidth}px, ${top}px)`;
    nameR.style.transform = `translate(${g.fx + inner}px, ${top}px)`;
    hi.style.left = (g.fx - inner - nameL.offsetWidth + fs * 0.04) + 'px';
    hi.style.top = (top - hi.offsetHeight * 1.05) + 'px';
    watching.style.left = (g.fx + inner + nameR.offsetWidth - watching.offsetWidth) + 'px';
    watching.style.top = (top + fs * 0.9) + 'px';
    [nameL, nameR, hi, watching].forEach(el => el.classList.add('ready'));
  }

  const lerpAngle = (a, b, t) => { let d = (b - a) % (Math.PI * 2); if (d < -Math.PI) d += Math.PI * 2; if (d > Math.PI) d -= Math.PI * 2; return a + d * t; };
  let angle = 0, lastImg = null, visible = true;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !geo) return;
    const g = geo, r = stage.getBoundingClientRect();
    const dx = mx - (r.left + g.fx), dy = my - (r.top + g.fy);
    const inDead = Math.hypot(dx, dy) < Math.min(g.W, g.H) * DEADZONE;
    angle = reduce ? Math.atan2(dy, dx) : lerpAngle(angle, Math.atan2(dy, dx), LERP);
    let a = angle % (Math.PI * 2); if (a < 0) a += Math.PI * 2;
    const idx = Math.round(a / (Math.PI * 2) * FRAMES) % FRAMES;
    const img = (inDead && center) || imgs[idx] || center;
    if (!img || (img === lastImg && !dirty)) return;   // only repaint when the frame changes
    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    ctx.fillStyle = '#f9f3f0'; ctx.fillRect(0, 0, g.W, g.H);
    ctx.drawImage(img, g.dx, g.dy, g.dw, g.dh);
    lastImg = img; dirty = false;
  }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  new ResizeObserver(layout).observe(stage);
  addEventListener('resize', layout);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layout);
  layout(); requestAnimationFrame(frame);

})();
