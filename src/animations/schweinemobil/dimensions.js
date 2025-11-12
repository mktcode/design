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
    { a: { x: 0, y: 0.93 }, b: { x: 0.233, y: 0.93 }, value: 292, orient: 'h' },
    { a: { x: 0.33, y: 0.09 }, b: { x: 0.33, y: 0.82 }, value: 290, orient: 'v' },
    { a: { x: 0.94, y: 0.18 }, b: { x: 0.94, y: 0.84 }, value: 250, orient: 'v' },
  ];
  const RED = '#e11d48';
  const LINE = 2; // px thickness
  state.dimensions = specs.map((spec) => {
    const g = document.createElement('div');
    Object.assign(g.style, {
      position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none',
    });

    const makeLine = () => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute', background: RED,
        width: '0px', height: '0px', opacity: '0', willChange: 'transform, width, height, opacity',
      });
      return el;
    };

    const path = makeLine();
    const tick1 = makeLine();
    const tick2 = makeLine();

    const label = document.createElement('div');
    label.textContent = `${spec.value} cm`;
    Object.assign(label.style, {
      position: 'absolute', color: RED, fontSize: '14px', fontFamily: 'Montserrat, Arial, sans-serif',
      whiteSpace: 'nowrap', transform: 'translate(-50%, -50%)', transformOrigin: '50% 50%', opacity: '0', pointerEvents: 'none',
    });

    g.appendChild(path); g.appendChild(tick1); g.appendChild(tick2); g.appendChild(label);
    stage.appendChild(g);
    return { spec, path, tick1, tick2, label, _container: g, _LINE: LINE };
  });
  layoutDimensions(state, { baseImg, stage });
  if (baseImg.complete) {
    primeDimensionStates(state);
  } else {
    // Ensure we prime once the image is ready so lengths are valid
    baseImg.addEventListener(
      'load',
      () => {
        layoutDimensions(state, { baseImg, stage });
        primeDimensionStates(state);
      },
      { once: true }
    );
  }
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
    // Main line sizing/position
    const LINE = d._LINE || 2;
    if (orient === 'h') {
      const left = Math.min(A.x, B.x);
      const top = A.y - LINE / 2;
      const width = Math.abs(B.x - A.x);
      Object.assign(d.path.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${LINE}px` });
      d._axis = 'x';
    } else {
      const left = A.x - LINE / 2;
      const top = Math.min(A.y, B.y);
      const height = Math.abs(B.y - A.y);
      Object.assign(d.path.style, { left: `${left}px`, top: `${top}px`, width: `${LINE}px`, height: `${height}px` });
      d._axis = 'y';
    }

    // Ticks perpendicular
    const tick = 10;
    if (orient === 'h') {
      Object.assign(d.tick1.style, { left: `${A.x - LINE / 2}px`, top: `${A.y - tick}px`, width: `${LINE}px`, height: `${tick * 2}px` });
      Object.assign(d.tick2.style, { left: `${B.x - LINE / 2}px`, top: `${B.y - tick}px`, width: `${LINE}px`, height: `${tick * 2}px` });
      d._tickAxis = 'y';
    } else {
      Object.assign(d.tick1.style, { left: `${A.x - tick}px`, top: `${A.y - LINE / 2}px`, width: `${tick * 2}px`, height: `${LINE}px` });
      Object.assign(d.tick2.style, { left: `${B.x - tick}px`, top: `${B.y - LINE / 2}px`, width: `${tick * 2}px`, height: `${LINE}px` });
      d._tickAxis = 'x';
    }

    // Label placement with offset normal to the line
    const dx = B.x - A.x, dy = B.y - A.y; const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; const off = 14;
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    labelSetPos(d.label, mx + nx * off, my + ny * off, orient);
  }
}

export function primeDimensionStates(state) {
  // Keep opacity 0 until animation actually starts, avoid tiny visible caps.
  state.dimensions.forEach((d) => {
    // Prime main line and ticks to grow from 0 to 1 along their axis
    if (d._axis === 'x') {
      gsap.set(d.path, { opacity: 0, scaleX: 0, transformOrigin: 'left center' });
    } else {
      gsap.set(d.path, { opacity: 0, scaleY: 0, transformOrigin: 'center top' });
    }
    if (d._tickAxis === 'x') {
      gsap.set([d.tick1, d.tick2], { opacity: 0, scaleX: 0, transformOrigin: 'center center' });
    } else {
      gsap.set([d.tick1, d.tick2], { opacity: 0, scaleY: 0, transformOrigin: 'center center' });
    }
    gsap.set(d.label, { opacity: 0, y: 4 });
  });
  state._dimPrimed = true;
}

export function animateDimensions(tl, state, { start = 0.2 }) {
  // Guarantee primed state (length + dash setup) before we animate
  if (!state._dimPrimed) {
    primeDimensionStates(state);
  }
  const step = 0.18;
  let end = start;
  state.dimensions.forEach((d, i) => {
    const t = start + i * step;
    // Draw the main line by growing width/height via scale
    if (d._axis === 'x') {
      tl.set(d.path, { opacity: 1 }, t);
      tl.to(d.path, { scaleX: 1, duration: 0.7, ease: 'power2.out' }, t);
    } else {
      tl.set(d.path, { opacity: 1 }, t);
      tl.to(d.path, { scaleY: 1, duration: 0.7, ease: 'power2.out' }, t);
    }

    // Draw tick marks similarly
    if (d._tickAxis === 'x') {
      tl.set([d.tick1, d.tick2], { opacity: 1 }, t + 0.12);
      tl.to(d.tick1, { scaleX: 1, duration: 0.25, ease: 'power2.out' }, t + 0.12);
      tl.to(d.tick2, { scaleX: 1, duration: 0.25, ease: 'power2.out' }, t + 0.18);
    } else {
      tl.set([d.tick1, d.tick2], { opacity: 1 }, t + 0.12);
      tl.to(d.tick1, { scaleY: 1, duration: 0.25, ease: 'power2.out' }, t + 0.12);
      tl.to(d.tick2, { scaleY: 1, duration: 0.25, ease: 'power2.out' }, t + 0.18);
    }
    // Label fade/slide
    tl.fromTo(
      d.label,
      { opacity: 0, y: 4 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', immediateRender: false },
      t + 0.32
    );
    end = Math.max(end, t + 0.32 + 0.35);
  });
  return end;
}

function safeLength(path) {
  try { return path.getTotalLength(); } catch { return 0; }
}

// Place label at absolute page coords inside stage, centered, and rotate for vertical
function labelSetPos(el, x, y, orient) {
  Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
  if (orient === 'v') {
    el.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
  } else {
    el.style.transform = 'translate(-50%, -50%)';
  }
}
