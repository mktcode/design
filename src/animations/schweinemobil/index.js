import { gsap, ScrollTrigger } from '../../gsapSetup.js';
import { createDimensions, layoutDimensions, animateDimensions, primeDimensionStates } from './dimensions.js';
import { createPhotos, layoutPhotoLines, layoutCaptions, animatePhotos } from './photos.js';

export function initSchweinemobil() {
  const section = document.getElementById('schweinemobil');
  if (!section) return;

  const stage = section.querySelector('.schweinemobil-stage');
  const baseImg = section.querySelector('.smobil-base');
  const svg = section.querySelector('.smobil-lines');
  const photosHost = section.querySelector('.smobil-photos');
  if (!stage || !baseImg || !svg || !photosHost) return;

  // Discover images
  const modules = import.meta.glob('../../../assets/img/schweinemobil/*.{webp,jpg,jpeg,png}', { eager: true, import: 'default' });
  const entries = Object.entries(modules).map(([k, url]) => ({ key: k, url }));
  const base = entries.find(e => /seite-hinten\.(webp|jpe?g|png)$/i.test(e.key))?.url;
  const detailPhotos = entries.filter(e => !/seite-hinten\.(webp|jpe?g|png)$/i.test(e.key)).map(e => e.url);
  if (base) baseImg.src = base;

  const state = { dimensions: [], items: [], anchors: [], positions: [] };
  // expose layouts for image onload callback
  state.layoutCaptions = () => layoutCaptions(state, { stage });

  // Build SVG viewBox to stage pixels
  function setSvgViewBox() {
    const r = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${Math.max(100, Math.round(r.width))} ${Math.max(100, Math.round(r.height))}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  setSvgViewBox();

  function relayoutAll() {
    setSvgViewBox();
    layoutDimensions(state, { baseImg, stage });
    if (!state._dimPrimed && baseImg.complete) primeDimensionStates(state);
    layoutPhotoLines(state, { stage, baseImg });
    layoutCaptions(state, { stage });
  }

  // Create visuals
  createDimensions(state, { baseImg, stage, svg });
  createPhotos(state, { stage, svg, photosHost, baseImg, detailPhotos });

  // Timeline orchestration
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=180%',
      scrub: true,
      pin: true,
      anticipatePin: 1,
      onUpdate: relayoutAll,
      onRefresh: relayoutAll,
    },
    defaults: { ease: 'power2.out' },
  });

  // Base fade-in
  tl.to(baseImg, { opacity: 1, duration: 0.8 }, 0);

  // Dimensions first
  const dimsEnd = animateDimensions(tl, state, { start: 0.2 });
  tl.add('dimsDone', dimsEnd);

  // Photos after dimensions
  animatePhotos(tl, state, { start: dimsEnd + 0.35 });

  // Resize/relayout hooks
  const ro = new ResizeObserver(() => relayoutAll());
  ro.observe(stage);
  window.addEventListener('resize', relayoutAll, { passive: true });

  // Wait for base image for accurate first layout
  if (!baseImg.complete) baseImg.addEventListener('load', () => { relayoutAll(); }, { once: true });
}
