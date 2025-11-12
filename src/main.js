import './style.css'

// Modular imports
import { initSmoothScroll } from './smoothScroll.js'
import { initFadeIn } from './animations/fadeIn.js'
import { initHeroParallax } from './animations/heroParallax.js'
import { initParallaxSection1 } from './animations/parallaxSection1.js'
import { initParallaxSection2 } from './animations/parallaxSection2.js'
import { initScrollSequence } from './sequence/scrollSequence.js'
import { initSequenceSlides } from './sequence/sequenceSlides.js'

// Initialize core subsystems
const lenis = initSmoothScroll()
initFadeIn()
initHeroParallax()
initParallaxSection1()
initParallaxSection2()
initScrollSequence()
initSequenceSlides()

console.info('App initialized (modular) with Lenis + GSAP ScrollTrigger')

// Re-export pieces for optional future dynamic usage or debugging
export { lenis }
// Update ScrollTrigger on scroll via Lenis

// Minimal, unobtrusive cart button handling (UI feedback only)
function initAddToCart() {
	document.addEventListener('click', (ev) => {
		const btn = ev.target.closest('button[data-add-to-cart]')
		if (!btn) return

		const card = btn.closest('article')
		const title = card?.querySelector('h4')?.textContent?.trim() ?? 'Produkt'
		const price = card?.querySelector('span.font-bold')?.textContent?.trim() ?? ''

		// Lightweight visual feedback
		const original = btn.textContent
		btn.disabled = true
		btn.textContent = 'Hinzugefügt ✓'
		setTimeout(() => {
			btn.disabled = false
			btn.textContent = original
		}, 1200)

		// Hook for future cart logic
		console.info('Added to cart:', { title, price })
	})
}

initAddToCart()

