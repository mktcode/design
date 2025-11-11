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
const fades = gsap.utils.toArray('.fade-in') || []
for (let i = 0; i < fades.length; i++) {
  const el = fades[i]
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
const heroFadeNodeList = document.querySelectorAll('#hero .fade-in')
console.debug('Hero fade elements count:', heroFadeNodeList.length)
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

// ------------------------------------------------------------
// Scroll-driven image sequence inside #sequence section only
// ------------------------------------------------------------
(function initScrollSequence() {
  const section = document.getElementById('sequence')
  const canvas = section ? section.querySelector('#bg-sequence') : null
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  // Sequence config
  const SCENE_SCROLL = 4000 // make the sequence slower/longer

  // Make canvas match device pixel ratio for crisp rendering
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  function resizeCanvas() {
    const parent = canvas.parentElement || section
    const rect = parent.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
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
    const state = { frame: 0 }

    // Pin the section to create a scene where the sequence plays
    gsap.to(state, {
      frame: frames.length - 1,
      ease: 'none',
      snap: 'frame',
      onUpdate: () => {
        if (currentFrame !== state.frame) {
          currentFrame = state.frame
          drawFrame(currentFrame)
        }
      },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${SCENE_SCROLL}`, // scroll distance allocated to play sequence
        pin: true,
        anticipatePin: 1,
        scrub: 0.6,
        markers: false,
        onEnter: () => fadeCanvas(1),
        onLeave: () => fadeCanvas(0),
        onEnterBack: () => fadeCanvas(1),
        onLeaveBack: () => fadeCanvas(0),
      },
    })

    // Debugging info
    console.info(`Sequence initialized: ${frames.length} frames over pinned scroll ${SCENE_SCROLL}px.`)
  }

  function fadeCanvas(target) {
    gsap.to(canvas, { opacity: target, duration: 0.6, ease: 'power2.out' })
  }

  // Initially hidden until sequence section pins
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

  // Create a scrubbed timeline which fades each block in and out sequentially
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=4000', // keep in sync with SCENE_SCROLL
      scrub: true,
      markers: false,
    },
    defaults: { ease: 'power2.out' },
  })

  const step = 1
  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i]
    // Set initial state
    gsap.set(el, { opacity: 0, y: 40 })
    // At time i*step, fade in, hold briefly, then fade out
    tl.to(el, { opacity: 1, y: 0, duration: 0.35 }, i * step)
      .to(el, { opacity: 0, y: -20, duration: 0.35 }, i * step + 0.65)
  }
})()

