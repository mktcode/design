import { gsap, lenis } from './gsapSetup.js'

export function initModal() {
  // Clone modal template and append
  const modalTemplate = document.getElementById('modal-template')
  const modal = modalTemplate.content.cloneNode(true).querySelector('.modal')
  document.body.appendChild(modal)

  const modalBody = modal.querySelector('.modal-body')
  const closeBtn = modal.querySelector('.modal-close')
  const contentWrapper = modal.querySelector('.modal-content')

  let lastFocused = null

  // Initial state
  gsap.set(modal, { autoAlpha: 0 })
  gsap.set(contentWrapper, { y: 40, autoAlpha: 0 })

  // Timeline for open/close
  const tl = gsap.timeline({
    paused: true,
    onReverseComplete: () => {
      modal.classList.remove('active')
      gsap.set(modal, { autoAlpha: 0 })
      lenis.start()
      if (lastFocused) lastFocused.focus()
    }
  })
  tl.to(modal, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' })
    .to(contentWrapper, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, '<0.05')

  function openModal(template) {
    if (!template) return
    modalBody.innerHTML = ''
    modalBody.appendChild(template.content.cloneNode(true))
    // Update accessible heading reference
    const heading = modalBody.querySelector('h1,h2,h3')
    if (heading) heading.id = 'modal-heading'
    lastFocused = document.activeElement
    modal.classList.add('active')
    gsap.set(contentWrapper, { y: 40, autoAlpha: 0 })
    lenis.stop()
    tl.play(0)
    // Focus close button for keyboard users
    setTimeout(() => closeBtn.focus(), 30)
  }

  function closeModal() {
    if (!modal.classList.contains('active')) return
    tl.reverse()
  }

  // Click handlers
  closeBtn.addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // Keyboard: ESC and simple focus trap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      e.preventDefault()
      closeModal()
    }
    if (e.key === 'Tab' && modal.classList.contains('active')) {
      const focusable = modal.querySelectorAll(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
      const elements = Array.from(focusable)
      if (!elements.length) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  })

  // Category link triggers
  const categoryLinks = document.querySelectorAll(
    'a[href^="#privatperson"], a[href^="#unternehmer"], a[href^="#freiberufler"], a[href^="#aerzte"]'
  )
  categoryLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const category = link.getAttribute('href').substring(1)
      const contentTemplate = document.getElementById(`modal-${category}`)
      openModal(contentTemplate)
    })
  })
}
