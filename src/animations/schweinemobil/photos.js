import { gsap } from '../../gsapSetup.js';

export function createPhotos(state, { stage, svg, photosHost, baseImg, detailPhotos }) {
  state.items = [];
  state.anchors = generateAnchors(detailPhotos.length);
  state.positions = generatePositions(detailPhotos.length);

  for (let i = 0; i < detailPhotos.length; i++) {
    const url = detailPhotos[i];
    const pos = state.positions[i];
    const anchor = state.anchors[i];

    const imgEl = document.createElement('img');
    imgEl.src = url;
    imgEl.alt = 'Detail';
    imgEl.className = 'absolute rounded-xl border-8 border-white shadow-2xl shadow-black/30 object-cover opacity-0 will-change-transform';
    imgEl.style.width = 'clamp(160px, 22vw, 440px)';
    imgEl.style.height = 'auto';
    imgEl.style.left = `${pos.x * 100}%`;
    imgEl.style.top = `${pos.y * 100}%`;
    imgEl.style.transform = 'translate(-50%, -50%)';
    imgEl.decoding = 'async';
    photosHost.appendChild(imgEl);

    if (!imgEl.complete) imgEl.addEventListener('load', () => state.layoutCaptions?.(), { once: true });

    // SVG lines
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const lineShadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lineShadow.setAttribute('fill', 'none');
    lineShadow.setAttribute('stroke', 'white');
    lineShadow.setAttribute('stroke-width', '6');
    lineShadow.setAttribute('stroke-linecap', 'round');
    lineShadow.setAttribute('stroke-linejoin', 'round');

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', getBrand());
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');

    g.appendChild(lineShadow); g.appendChild(line); svg.appendChild(g);
    line.style.opacity = '0'; lineShadow.style.opacity = '0';

    // Captions
    let captionEl = null, placement = null;
    let headline = '', sentence = '';
    if (i === 0) { placement = 'right'; headline = 'Transport & Aufbau'; sentence = 'Flexibel direkt auf dem Feld.'; }
    else if (i === 1) { placement = 'below'; headline = 'Einstieg & Rampe'; sentence = 'Komfortabel und sicher.'; }
    else if (i === detailPhotos.length - 1) { placement = 'left'; headline = 'Serviceklappe & Technik'; sentence = 'Einfacher Zugang für Wartung.'; }
    if (placement) {
      captionEl = document.createElement('div');
      captionEl.className = 'smobil-caption absolute max-w-[30ch] text-(--color-brand) text-xs sm:text-sm md:text-base opacity-0 leading-snug font-medium will-change-transform';
      captionEl.innerHTML = `<strong class="block mb-0.5 font-semibold text-[0.85rem] sm:text-sm md:text-base">${headline}</strong><span class="block font-normal">${sentence}</span>`;
      photosHost.appendChild(captionEl);
    }

    state.items.push({ imgEl, line, lineShadow, anchor, index: i, captionEl, placement });
  }
}

export function layoutPhotoLines(state, { stage, baseImg }) {
  for (const it of state.items) {
    const start = centerOf(it.imgEl, stage);
    const end = anchorToStage(it.anchor, baseImg, stage);
    const d = wavyPath(start, end, 0.09);
    it.line.setAttribute('d', d);
    it.lineShadow.setAttribute('d', d);
  }
}

export function layoutCaptions(state, { stage }) {
  for (const it of state.items) {
    if (!it.captionEl) continue;
    const stageRect = stage.getBoundingClientRect();
    const imgRect = it.imgEl.getBoundingClientRect();
    if (it.placement === 'right') {
      it.captionEl.style.left = `${(imgRect.left + imgRect.width / 2) - stageRect.left}px`;
      it.captionEl.style.top = `${imgRect.bottom - stageRect.top + 12}px`;
      it.captionEl.style.transform = 'translate(-50%, 0)';
    } else if (it.placement === 'left') {
      it.captionEl.style.left = `${imgRect.left - stageRect.left - 16}px`;
      it.captionEl.style.top = `${(imgRect.top + imgRect.height / 2) - stageRect.top}px`;
      it.captionEl.style.transform = 'translate(-100%, -50%)';
    } else { // below
      it.captionEl.style.left = `${(imgRect.left + imgRect.width / 2) - stageRect.left}px`;
      it.captionEl.style.top = `${imgRect.bottom - stageRect.top + 12}px`;
      it.captionEl.style.transform = 'translate(-50%, 0)';
    }
  }
}

export function animatePhotos(tl, state, { start }) {
  const step = 0.55;
  state.items.forEach((it, i) => {
    const t = start + i * step;
    const L = safeLength(it.line); const Ls = safeLength(it.lineShadow);
    gsap.set([it.line, it.lineShadow], { strokeDasharray: L, strokeDashoffset: L + 6 });
    if (Ls && Ls !== L) gsap.set(it.lineShadow, { strokeDasharray: Ls, strokeDashoffset: Ls + 6 });

    const pos = state.positions[i];
    const enterOffset = pos.y > 0.65 ? { x: 0, y: 26 } : (pos.x < 0.5 ? { x: -24, y: 0 } : { x: 24, y: 0 });

    tl.fromTo(
      it.imgEl,
      { opacity: 0, x: enterOffset.x, y: enterOffset.y },
      { opacity: 1, x: 0, y: 0, duration: 0.6, ease: 'power3.out', immediateRender: false },
      t
    ).fromTo(
      [it.lineShadow, it.line],
      { opacity: 0, strokeDashoffset: (idx) => (idx === 0 ? Ls + 6 : L + 6) },
      { opacity: 1, strokeDashoffset: 0, duration: 0.8, ease: 'power2.out', immediateRender: false },
      t + 0.1
    );

    if (it.captionEl) {
      const capEnter = it.placement === 'right' ? { x: 8, y: 0 } : it.placement === 'left' ? { x: -8, y: 0 } : { x: 0, y: 10 };
      tl.fromTo(
        it.captionEl,
        { opacity: 0, x: capEnter.x, y: capEnter.y },
        { opacity: 1, x: 0, y: 0, duration: 0.4, ease: 'power2.out', immediateRender: false },
        t + 0.14
      );
    }
  });
}

// Helpers
function getBrand() {
  const root = getComputedStyle(document.documentElement);
  return root.getPropertyValue('--color-brand')?.trim() || '#222750';
}
function safeLength(path) { try { return path.getTotalLength(); } catch { return 0; } }
function centerOf(el, stage) {
  const r = el.getBoundingClientRect(); const s = stage.getBoundingClientRect();
  return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
}
function anchorToStage(anchor, baseImg, stage) {
  const br = baseImg.getBoundingClientRect(); const sr = stage.getBoundingClientRect();
  return { x: br.left - sr.left + br.width * anchor.x, y: br.top - sr.top + br.height * anchor.y };
}
function wavyPath(start, end, ampFactor = 0.08) {
  const dx = end.x - start.x, dy = end.y - start.y; const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len; const px = -uy, py = ux;
  const amp = Math.min(60, len * ampFactor);
  const p1 = { x: start.x + dx * 0.33, y: start.y + dy * 0.33 };
  const p2 = { x: start.x + dx * 0.66, y: start.y + dy * 0.66 };
  const c1 = { x: start.x + dx * 0.16 + px * amp, y: start.y + dy * 0.16 + py * amp };
  const c2 = { x: start.x + dx * 0.50 - px * amp, y: start.y + dy * 0.50 - py * amp };
  const c3 = { x: start.x + dx * 0.84 + px * amp * 0.7, y: start.y + dy * 0.84 + py * amp * 0.7 };
  return [
    `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`,
    `Q ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    `Q ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    `Q ${c3.x.toFixed(1)} ${c3.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
  ].join(' ');
}

function generateAnchors(n) {
  const fixed = [
    { x: 0.58, y: 0.34 },
    { x: 0.66, y: 0.33 },
    { x: 0.60, y: 0.60 },
    { x: 0.44, y: 0.68 },
    { x: 0.36, y: 0.30 },
    { x: 0.20, y: 0.56 },
    { x: 0.72, y: 0.70 },
    { x: 0.82, y: 0.42 },
  ];
  if (n <= fixed.length) return fixed.slice(0, n);
  const out = fixed.slice(); const extras = n - fixed.length;
  for (let i = 0; i < extras; i++) {
    const t = (i / extras) * Math.PI * 2; out.push({ x: 0.5 + 0.34 * Math.cos(t), y: 0.5 + 0.30 * Math.sin(t) });
  }
  return out;
}

function generatePositions(n) {
  const spots = [
    { x: 0.38, y: 0.2 },
    { x: 0.76, y: 0.32 },
    { x: 0.50, y: 0.76 },
    { x: 0.84, y: 0.76 },
    { x: 0.50, y: 0.14 },
    { x: 0.50, y: 0.86 },
    { x: 0.28, y: 0.46 },
    { x: 0.72, y: 0.52 },
  ];
  if (n <= spots.length) return spots.slice(0, n);
  const out = spots.slice(); const extras = n - spots.length;
  for (let i = 0; i < extras; i++) {
    const a = (i / extras) * Math.PI * 2; out.push({ x: 0.5 + 0.40 * Math.cos(a), y: 0.5 + 0.40 * Math.sin(a) });
  }
  return out;
}
