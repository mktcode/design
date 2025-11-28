import { gsap } from './gsapSetup'
import { initSmoothScroll } from './smoothScroll.js'
import { initModal } from './modal.js'

// Initialize core subsystems
initSmoothScroll()
initModal()

gsap.fromTo('#target-groups a', {
  opacity: 0,
  scale: 0.9,
}, {
  opacity: 1,
  scale: 1,
  duration: 0.3,
  delay: 0.3,
  ease: 'power2.out',
  stagger: 0.1,
})