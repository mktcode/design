import './style.css'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
  // You can tweak these settings as needed
  lerp: 0.08,
  wheelMultiplier: 1,
  smoothWheel: true,
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// Update ScrollTrigger on scroll via Lenis
lenis.on('scroll', () => {
  ScrollTrigger.update()
})

// If you need scrollerProxy (usually only when using a custom scroll container):
// Here we map documentElement scrollTop writes to Lenis and reads from window.scrollY.
ScrollTrigger.scrollerProxy(document.documentElement, {
  scrollTop(value) {
    if (value !== undefined) {
      lenis.scrollTo(value, { immediate: true })
    }
    return window.scrollY || document.documentElement.scrollTop
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
  },
})

// Ensure ScrollTrigger refreshes after setup
ScrollTrigger.addEventListener('refresh', () => lenis.resize())
ScrollTrigger.refresh()

// Simple animations for elements with .fade-in class as they enter viewport
const fades = gsap.utils.toArray('.fade-in')

fades.forEach((el, i) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      delay: i * 0.05,
      scrollTrigger: {
        trigger: el,
        start: 'top 50%',
        toggleActions: 'play none none reverse',
      },
    }
  )
})

// Example of a pinned section (hero) fade gradient
ScrollTrigger.create({
  trigger: '#hero',
  start: 'top top',
  end: '+=60%',
  pin: true,
  pinSpacing: true,
  onEnter: () => {},
})

// Optional: hook GSAP's internal ticker to Lenis for time-based animations
// gsap.ticker.add((time) => {
//   // This keeps GSAP in sync with Lenis if needed
// })

console.info('App initialized with Lenis + GSAP ScrollTrigger')
