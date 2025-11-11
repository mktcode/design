import { gsap } from '../gsapSetup.js';

export function initSequenceSlides() {
  const section = document.getElementById('sequence');
  if (!section) return;
  const blocks = section.querySelectorAll('.sequence-slides .text-block');
  if (!blocks.length) return;

  for (let i = 0; i < blocks.length; i++) blocks[i].classList.remove('is-visible');
  blocks[0].classList.add('is-visible');
  blocks[0].style.opacity = '1';
  blocks[0].style.transform = 'translateY(0)';

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      scrub: true,
    },
    defaults: { ease: 'power2.out' },
  });

  const seg = 1 / blocks.length;
  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i];
    const t = i * seg;
    tl.add(() => {
      for (let j = 0; j < blocks.length; j++) blocks[j].classList.remove('is-visible');
      el.classList.add('is-visible');
    }, t);
  }

  return tl;
}
