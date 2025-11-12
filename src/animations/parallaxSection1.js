import { gsap, ScrollTrigger } from '../gsapSetup.js';

/**
 * Parallax three feature images with individual speeds.
 * Contract:
 * - Targets .feature-parallax .parallax-item elements
 * - Uses data-speed attribute (0..1) to scale travel distance
 * - Motion is scrubbed between section enter and leave
 */
export function initParallaxSection1() {
  const container = document.querySelector('#welcome .feature-parallax');
  if (!container) return;

  const items = gsap.utils.toArray(container.querySelectorAll('.parallax-item'));
  if (!items.length) return;

  // Ensure ScrollTrigger is registered (done in gsapSetup) and refresh on resize
  items.forEach((el) => {
    const speed = parseFloat(el.getAttribute('data-speed')) || 0.2;
    const rotateTarget = parseFloat(el.getAttribute('data-rotate')) || 0;
    // Animate position + rotation for more visible tilt emerging with scroll
    gsap.fromTo(
      el,
      { y: 0, rotate: 0 },
      {
        y: () => -window.innerHeight * speed,
        rotate: rotateTarget,
        ease: 'none',
        scrollTrigger: {
          trigger: '#welcome',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });

  // Optional: refresh on image load to avoid jitter when images are cached/late
  const imgs = container.querySelectorAll('img');
  imgs.forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', () => ScrollTrigger.refresh());
  });
}
