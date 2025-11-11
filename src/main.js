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

// Ensure ScrollTrigger refreshes after setup
ScrollTrigger.addEventListener('refresh', () => lenis.resize())
ScrollTrigger.refresh()

// Simple animations for elements with .fade-in class as they enter viewport
try {
  const fades = document.querySelectorAll('.fade-in')
  for (let i = 0; i < fades.length; i++) {
    const el = fades[i]
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
    )
  }
} catch (e) {
  console.warn('Fade-in setup skipped', e)
}

console.info('App initialized with Lenis + GSAP ScrollTrigger')

// ------------------------------------------------------------
// Hero parallax (restored)
const heroTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
})
  .fromTo('.hero-bg', { scale: 1, opacity: 1 }, { scale: 1.35, opacity: 0, ease: 'none' }, 0)
  .to('.hero-overlay', { opacity: 0, ease: 'none' }, 0)
  .to('#hero .text-center', { y: -60, opacity: 0.7, ease: 'power1.out' }, 0.05)

// Collect hero fade-ins defensively; avoid forEach if environment polyfills are off
try {
  const heroFadeNodeList = document.querySelectorAll('#hero .fade-in')
  for (let i = 0; i < heroFadeNodeList.length; i++) {
    const el = heroFadeNodeList[i]
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
  }
} catch (e) {
  console.warn('Hero fade setup skipped', e)
}

// ------------------------------------------------------------
// Scroll-driven image sequence inside #sequence section only
// ------------------------------------------------------------
(function initScrollSequence() {
  const section = document.getElementById('sequence')
  const canvas = section ? section.querySelector('#bg-sequence') : null
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  // Sequence config (kept for reference; we now use section height instead)
  const SCENE_SCROLL = 4000 // no longer used for pinning, section height drives progress

  // Make canvas match device pixel ratio for crisp rendering
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  function resizeCanvas() {
    const parent = canvas.parentElement || section
    const rect = parent.getBoundingClientRect()
    const w = rect.width || window.innerWidth * 0.55
    const h = rect.height || window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    // Redraw current frame after resize
    if (frames.length && images[currentFrame]) {
      drawFrame(currentFrame)
    }
  }

  // Collect all frames with Vite's glob (returns URLs as default exports)
  const modules = import.meta.glob('../assets/img/schwein/*.jpg', { eager: true, import: 'default' })
  // Sort by numeric index in filename (e.g., frame_00001.jpg)
  const frames = Object.entries(modules)
    .sort((a, b) => {
      const getNum = (s) => parseInt(s.match(/(\d+)/)?.[1] || '0', 10)
      return getNum(a[0]) - getNum(b[0])
    })
    .map(([, url]) => url)

  if (!frames.length) {
    console.warn('No sequence frames found. Check path ../assets/img/schwein/*.jpg')
    return
  }

  const images = new Array(frames.length)
  let currentFrame = 0
  let ready = false

  function loadImage(url) {
    return new Promise((resolve) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = url
      img.onload = () => resolve(img)
      img.onerror = (e) => {
        console.warn('Image failed to load:', url, e)
        resolve(img)
      }
    })
  }

  async function preloadAll() {
    // Load first frame ASAP for instant feedback
  const first = await loadImage(frames[0])
    images[0] = first
  resizeCanvas()
  requestAnimationFrame(() => drawFrame(0))
    // Then load remaining frames in background
    const rest = await Promise.all(frames.slice(1).map((u) => loadImage(u)))
    rest.forEach((img, i) => (images[i + 1] = img))
    ready = true
    setupScrub()
  }

  function drawFrame(index) {
    const img = images[index]
    if (!img) {
      console.debug('drawFrame skipped; image not loaded for index', index)
      return
    }
    const cw = canvas.width
    const ch = canvas.height
    ctx.clearRect(0, 0, cw, ch)
    // Draw like CSS background-size: cover
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    const canvasRatio = cw / ch
    const imageRatio = iw / ih
    let dw, dh
    if (imageRatio > canvasRatio) {
      dh = ch
      dw = (iw * ch) / ih
    } else {
      dw = cw
      dh = (ih * cw) / iw
    }
    const dx = (cw - dw) / 2
    const dy = (ch - dh) / 2
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    try {
      ctx.drawImage(img, dx, dy, dw, dh)
    } catch (err) {
      console.error('drawImage error', err, { index, img, cw, ch, dw, dh })
    }
    // Debug first few draws
    if (index < 3) {
      console.debug(`Frame ${index} drawn (canvas ${cw}x${ch}, image ${iw}x${ih})`) 
    }
  }

  function setupScrub() {
    if (!ready || !frames.length) return

    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress || 0
        const idx = Math.round(p * (frames.length - 1))
        if (currentFrame !== idx) {
          currentFrame = idx
          drawFrame(currentFrame)
        }
        // Scroll-linked fade for canvas without utils (robust across builds)
        const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)))
        const fadeIn = ramp(p, 0.04, 0.16)
        const fadeOut = ramp(1 - p, 0.04, 0.16)
        const opacity = Math.min(fadeIn, fadeOut)
        canvas.style.opacity = opacity
      },
    })

    console.info(`Sequence initialized: ${frames.length} frames; progress bound to section scroll.`)
  }

  function fadeCanvas(target) {
    gsap.to(canvas, { opacity: target, duration: 0.6, ease: 'power2.out' })
  }

  // Initially hidden; will fade in as section progress increases
  canvas.style.opacity = 0

  const ro = new ResizeObserver(() => resizeCanvas())
  ro.observe(canvas.parentElement || section)
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()
  preloadAll().catch((e) => console.error('Sequence preload failed', e))
})()

// ------------------------------------------------------------
// Slides: show one text-block at a time during the sequence pin
// ------------------------------------------------------------
(function initSequenceSlides() {
  const section = document.getElementById('sequence')
  if (!section) return
  const blocks = section.querySelectorAll('.sequence-slides .text-block')
  if (!blocks.length) return

  // Reveal one block at a time using class toggles (ensure first is visible immediately)
  for (let i = 0; i < blocks.length; i++) blocks[i].classList.remove('is-visible')
  blocks[0].classList.add('is-visible')
  // Also forcibly set inline style so opacity isn't zero if CSS is overridden
  blocks[0].style.opacity = '1'
  blocks[0].style.transform = 'translateY(0)'

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      scrub: true,
    },
    defaults: { ease: 'power2.out' },
  })

  const seg = 1 / blocks.length
  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i]
    const t = i * seg
    tl.add(() => {
      for (let j = 0; j < blocks.length; j++) blocks[j].classList.remove('is-visible')
      el.classList.add('is-visible')
    }, t)
  }
})()

