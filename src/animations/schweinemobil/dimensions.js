import { gsap } from '../../gsapSetup.js';

/**
 * Dimension overlay module
 * Responsibilities:
 * - Create measurement graphics (lines, ticks, labels) relative to base image
 * - Provide layout + animation hooks
 */
export function createDimensions(state, { baseImg, stage, svg }) {
  // Specs in normalized (0..1) coords inside the base image
  const specs = [
    { a: { x: 0.185, y: 0.83 }, b: { x: 0.335, y: 0.83 }, value: 292, orient: 'h' },
    { a: { x: 0.455, y: 0.40 }, b: { x: 0.455, y: 0.82 }, value: 250, orient: 'v' },
    { a: { x: 0.915, y: 0.42 }, b: { x: 0.915, y: 0.84 }, value: 250, orient: 'v' },
  ];
  const RED = '#e11d48';
  state.dimensions = specs.map((spec) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', RED);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    const tick1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const tick2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    for (const t of [tick1, tick2]) {
      t.setAttribute('fill', 'none');
      t.setAttribute('stroke', RED);
      t.setAttribute('stroke-width', '2');
      t.setAttribute('stroke-linecap', 'round');
    }
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('fill', RED);
    label.setAttribute('font-size', '14');
    label.setAttribute('font-family', 'Montserrat, Arial, sans-serif');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.textContent = `${spec.value} cm`;

    g.appendChild(path); g.appendChild(tick1); g.appendChild(tick2); g.appendChild(label);
    svg.appendChild(g);
    // Start fully invisible until we can compute lengths after base image is laid out
    path.style.opacity = '0';
    tick1.style.opacity = '0';
    tick2.style.opacity = '0';
    label.style.opacity = '0';
    return { spec, path, tick1, tick2, label };
  });
  layoutDimensions(state, { baseImg, stage });
  if (baseImg.complete) primeDimensionStates(state);
}

export function layoutDimensions(state, { baseImg, stage }) {
  if (!baseImg.complete) return; // wait for image for accurate rects
  const baseR = baseImg.getBoundingClientRect();
  const stageR = stage.getBoundingClientRect();
  const toStage = (p) => ({
    x: stageR.left - stageR.left + (baseR.left - stageR.left) + baseR.width * p.x,
    y: stageR.top - stageR.top + (baseR.top - stageR.top) + baseR.height * p.y,
  });
  for (const d of state.dimensions) {
    const { a, b, orient } = d.spec;
    const A = toStage(a), B = toStage(b);
    d.path.setAttribute('d', `M ${A.x} ${A.y} L ${B.x} ${B.y}`);
    // Ticks perpendicular
    const dx = B.x - A.x, dy = B.y - A.y; const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; const tick = 10;
    const t1a = { x: A.x + nx * tick, y: A.y + ny * tick }; const t1b = { x: A.x - nx * tick, y: A.y - ny * tick };
    const t2a = { x: B.x + nx * tick, y: B.y + ny * tick }; const t2b = { x: B.x - nx * tick, y: B.y - ny * tick };
    d.tick1.setAttribute('d', `M ${t1a.x} ${t1a.y} L ${t1b.x} ${t1b.y}`);
    d.tick2.setAttribute('d', `M ${t2a.x} ${t2a.y} L ${t2b.x} ${t2b.y}`);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2; const off = 14;
    d.label.setAttribute('x', (mx + nx * off)); d.label.setAttribute('y', (my + ny * off));
    if (orient === 'v') d.label.setAttribute('transform', `rotate(-90 ${mx + nx * off} ${my + ny * off})`);
    else d.label.removeAttribute('transform');
  }
}

export function primeDimensionStates(state) {
  // Keep opacity 0 until animation actually starts, avoid tiny visible caps.
  state.dimensions.forEach((d) => {
    const L = safeLength(d.path);
    gsap.set(d.path, { opacity: 0, strokeDasharray: L, strokeDashoffset: L });
    gsap.set([d.tick1, d.tick2], { opacity: 0, strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(d.label, { opacity: 0, y: 4 });
  });
  state._dimPrimed = true;
}

export function animateDimensions(tl, state, { start = 0.2 }) {
  const step = 0.18;
  let end = start;
  state.dimensions.forEach((d, i) => {
    const t = start + i * step;
    const L = safeLength(d.path);
    // Path draw with opacity fade
    tl.fromTo(
      d.path,
      { opacity: 0, strokeDasharray: L, strokeDashoffset: L },
      { opacity: 1, strokeDashoffset: 0, duration: 0.6, ease: 'power2.out', immediateRender: false },
      t
    );
    // Ticks appear (no dash draw needed, just fade) after slight delay
    tl.fromTo(
      [d.tick1, d.tick2],
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out', immediateRender: false },
      t + 0.15
    );
    // Label fade/slide
    tl.fromTo(
      d.label,
      { opacity: 0, y: 4 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', immediateRender: false },
      t + 0.3
    );
    end = Math.max(end, t + 0.3 + 0.35);
  });
  return end;
}

function safeLength(path) {
  try { return path.getTotalLength(); } catch { return 0; }
}
