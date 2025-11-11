import { ScrollTrigger } from '../gsapSetup.js';

export function initScrollSequence() {
  const section = document.getElementById('sequence');
  const canvas = section ? section.querySelector('#bg-sequence') : null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Make canvas match device pixel ratio for crisp rendering
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resizeCanvas() {
    const parent = canvas.parentElement || section;
    const rect = parent.getBoundingClientRect();
    const w = rect.width || window.innerWidth * 0.55;
    const h = rect.height || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    // Redraw current frame after resize
    if (frames.length && images[currentFrame]) {
      drawFrame(currentFrame);
    }
  }

  // Collect all frames (path adjusted for new module location)
  const modules = import.meta.glob('../../assets/img/schwein/*.jpg', { eager: true, import: 'default' });
  const frames = Object.entries(modules)
    .sort((a, b) => {
      const getNum = (s) => parseInt(s.match(/(\d+)/)?.[1] || '0', 10);
      return getNum(a[0]) - getNum(b[0]);
    })
    .map(([, url]) => url);

  if (!frames.length) {
    console.warn('No sequence frames found. Check path ../../assets/img/schwein/*.jpg');
    return;
  }

  const images = new Array(frames.length);
  let currentFrame = 0;
  let ready = false;

  function loadImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.warn('Image failed to load:', url, e);
        resolve(img);
      };
    });
  }

  async function preloadAll() {
    const first = await loadImage(frames[0]);
    images[0] = first;
    resizeCanvas();
    requestAnimationFrame(() => drawFrame(0));
    const rest = await Promise.all(frames.slice(1).map((u) => loadImage(u)));
    rest.forEach((img, i) => (images[i + 1] = img));
    ready = true;
    setupScrub();
  }

  function drawFrame(index) {
    const img = images[index];
    if (!img) {
      console.debug('drawFrame skipped; image not loaded for index', index);
      return;
    }
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const canvasRatio = cw / ch;
    const imageRatio = iw / ih;
    let dw, dh;
    if (imageRatio > canvasRatio) {
      dh = ch;
      dw = (iw * ch) / ih;
    } else {
      dw = cw;
      dh = (ih * cw) / iw;
    }
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    try {
      ctx.drawImage(img, dx, dy, dw, dh);
    } catch (err) {
      console.error('drawImage error', err, { index, img, cw, ch, dw, dh });
    }
    if (index < 3) {
      console.debug(`Frame ${index} drawn (canvas ${cw}x${ch}, image ${iw}x${ih})`);
    }
  }

  function setupScrub() {
    if (!ready || !frames.length) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom center',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress || 0;
        const idx = Math.round(p * (frames.length - 1));
        if (currentFrame !== idx) {
          currentFrame = idx;
          drawFrame(currentFrame);
        }
        const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
        // Slow fade: take ~35% of the section at each side to reach full opacity
        const fadeIn = ramp(p, 0.0, 0.35);
        const fadeOut = ramp(1 - p, 0.0, 0.35);
        const opacity = Math.min(fadeIn, fadeOut);
        canvas.style.opacity = opacity;
      },
    });

    console.info(`Sequence initialized: ${frames.length} frames; progress bound to section scroll.`);
  }

  // Initially hidden; will fade in as section progress increases
  canvas.style.opacity = 0;

  const ro = new ResizeObserver(() => resizeCanvas());
  ro.observe(canvas.parentElement || section);
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  preloadAll().catch((e) => console.error('Sequence preload failed', e));
}
