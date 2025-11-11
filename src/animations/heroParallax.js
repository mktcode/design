import { gsap } from '../gsapSetup.js';

export function initHeroParallax() {
  // Hero parallax timeline
  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  })
    .fromTo('.hero-bg', { scale: 1, opacity: 1 }, { scale: 1.35, opacity: 0, ease: 'none' }, 0)
    .to('.hero-overlay', { opacity: 0, ease: 'none' }, 0)
    .to('#hero .text-center', { y: -60, opacity: 0.7, ease: 'power1.out' }, 0.05);

  // Subtle upward motion for hero fades
  try {
    const heroFadeNodeList = document.querySelectorAll('#hero .fade-in');
    for (let i = 0; i < heroFadeNodeList.length; i++) {
      const el = heroFadeNodeList[i];
      gsap.to(el, {
        y: -20,
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
        ease: 'none',
      });
    }
  } catch (e) {
    console.warn('Hero fade setup skipped', e);
  }

  return heroTl;
}
