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