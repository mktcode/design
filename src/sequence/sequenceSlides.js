import { gsap } from '../gsapSetup.js';

export function initSequenceSlides() {
  const section = document.getElementById('sequence');
  if (!section) return;
  const blocks = section.querySelectorAll('.sequence-slides .text-block');
  if (!blocks.length) return;

  for (let i = 0; i < blocks.length; i++) blocks[i].classList.remove('is-visible');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
    defaults: { ease: 'power2.out' },
  });

  // Make slides appear later and occupy a compressed window inside the timeline
  // Reserve first 30% for only sequence frames (no text), then show each block within next 40%, then hide again.
  const visibleWindowStart = 0.30;
  const visibleWindowEnd = 1; // after which all texts are hidden while frames continue
  const seg = (visibleWindowEnd - visibleWindowStart) / blocks.length;
  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i];
    const t = visibleWindowStart + i * seg;
    tl.add(() => {
      for (let j = 0; j < blocks.length; j++) blocks[j].classList.remove('is-visible');
      el.classList.add('is-visible');
    }, t);
  }
  // Add a cleanup point at end of window
  tl.add(() => {
    for (let j = 0; j < blocks.length; j++) blocks[j].classList.remove('is-visible');
  }, visibleWindowEnd);

  return tl;
}
