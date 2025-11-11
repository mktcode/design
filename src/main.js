import './style.css'

// Modular imports
import { initSmoothScroll } from './smoothScroll.js'
import { initFadeIn } from './animations/fadeIn.js'
import { initHeroParallax } from './animations/heroParallax.js'
import { initScrollSequence } from './sequence/scrollSequence.js'
import { initSequenceSlides } from './sequence/sequenceSlides.js'

// Initialize core subsystems
const lenis = initSmoothScroll()
initFadeIn()
initHeroParallax()
initScrollSequence()
initSequenceSlides()

console.info('App initialized (modular) with Lenis + GSAP ScrollTrigger')

// Re-export pieces for optional future dynamic usage or debugging
export { lenis }
// Update ScrollTrigger on scroll via Lenis

