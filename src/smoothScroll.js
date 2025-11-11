import Lenis from '@studio-freight/lenis';
import { ScrollTrigger } from './gsapSetup.js';

let lenisInstance;

export function initSmoothScroll(options = {}) {
  if (lenisInstance) return lenisInstance;

  const lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 0.5,
    smoothWheel: true,
    ...options,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Bridge Lenis -> ScrollTrigger
  lenis.on('scroll', () => {
    try { ScrollTrigger.update(); } catch (_) {}
  });

  // Ensure ScrollTrigger refresh hooks into Lenis sizing
  try {
    ScrollTrigger.addEventListener('refresh', () => lenis.resize());
    ScrollTrigger.refresh();
  } catch (e) {
    console.debug('ScrollTrigger not ready yet', e);
  }

  lenisInstance = lenis;
  return lenisInstance;
}

export { lenisInstance as lenis };
