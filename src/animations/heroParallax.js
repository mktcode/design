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
    .fromTo('header', { backgroundColor: 'rgba(255, 255, 255, 0)' }, { backgroundColor: 'rgba(255, 255, 255, 1)', color: 'var(--color-brand)', ease: 'none' }, 0)
    .fromTo('.hero-bg', { scale: 1, opacity: 1, filter: 'blur(0px)' }, { scale: 1.35, opacity: 0.5, filter: 'blur(10px)', ease: 'none' }, 0)
    .to('.hero-overlay', { opacity: 1, duration: 0.2, ease: 'none' }, 0)
    .to('#hero .text-center', { y: -60, opacity: 0, duration: 0.1, ease: 'power1.out' }, 0.05);

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
