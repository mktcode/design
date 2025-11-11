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
    { opacity: 0, y: 60 },
    {
      opacity: 1,
      y: 0,
      duration: 1.4,
      ease: 'power3.out',
      delay: i * 0.15, // stagger more noticeably
      scrollTrigger: {
        trigger: el,
        start: 'top 65%', // start a bit later for more anticipation
        end: 'bottom 45%',
        toggleActions: 'play none none reverse',
      },
    }
  )
})

// Parallax + reveal timeline for hero background
// Scales and fades hero background + overlay while gently lifting/fading content
const heroTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top', // run until the end of the hero reaches the top
    scrub: true,
  },
})
  .fromTo('.hero-bg', { scale: 1, opacity: 1 }, { scale: 1.35, opacity: 0, ease: 'none' }, 0)
  .to('.hero-overlay', {
    opacity: 0,
    ease: 'none',
  }, 0)
  .to('#hero .text-center', {
    y: -60,
    opacity: 0.7,
    ease: 'power1.out',
  }, 0.05)

// Optional subtle counter-move for foreground elements for extra depth
gsap.utils.toArray('#hero .fade-in').forEach((el) => {
  gsap.to(el, {
    y: -20,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
    ease: 'none',
  })
})

// Removed hero pin so the sticky header always stays at the top (already handled earlier)

// Optional: hook GSAP's internal ticker to Lenis for time-based animations
// gsap.ticker.add((time) => {
//   // This keeps GSAP in sync with Lenis if needed
// })

console.info('App initialized with Lenis + GSAP ScrollTrigger')
