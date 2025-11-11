import { gsap } from '../gsapSetup.js';

export function initFadeIn() {
  try {
    const fades = document.querySelectorAll('.fade-in');
    for (let i = 0; i < fades.length; i++) {
      const el = fades[i];
      gsap.fromTo(
        el,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          delay: i * 0.12,
          scrollTrigger: {
            trigger: el,
            start: 'top 70%',
            end: 'bottom 45%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  } catch (e) {
    console.warn('Fade-in setup skipped', e);
  }
}
