import { gsap } from './gsapSetup'

gsap.fromTo('#target-groups a', {
  opacity: 0,
}, {
  opacity: 1,
  duration: 0.3,
  delay: 0.3,
  ease: 'power2.out',
  stagger: 0.1,
})

const links = [...document.querySelectorAll('a[href^="#"]')];

const items = links
  .map(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return null;

    const section = document.querySelector(href);
    return section ? { link, section } : null;
  })
  .filter(Boolean);

let activeLink = null;
let debounceTimer = null;

function updateActive() {
  const center = window.innerHeight / 2;
  const maxDistance = window.innerHeight * 0.5;

  let best = null;
  let bestDistance = Infinity;

  items.forEach(item => {
    const rect = item.section.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const distance = Math.abs(sectionCenter - center);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = item;
    }
  });

  const nextLink =
    best && bestDistance <= maxDistance
      ? best.link
      : null;

  if (nextLink === activeLink) return;

  activeLink?.classList.remove('active');
  nextLink?.classList.add('active');
  activeLink = nextLink;
}

function debouncedUpdate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateActive, 50);
}

window.addEventListener('scroll', debouncedUpdate, { passive: true });
window.addEventListener('resize', debouncedUpdate);

updateActive();