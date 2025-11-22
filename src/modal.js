import { gsap } from './gsapSetup.js'

export function initModal() {
  const modal = document.getElementById('modal')
  const modalBody = modal.querySelector('.modal-body')
  const closeBtn = modal.querySelector('.modal-close')
  let lastFocused = null

  gsap.set(modal, { autoAlpha: 0 })
  gsap.set(modalBody, { y: 40, autoAlpha: 0 })

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } })
  tl.to(modal, { autoAlpha: 1, duration: 0.25 })
    .to(modalBody, { y: 0, autoAlpha: 1, duration: 0.35 }, '<0.05')

  function openModal(categoryId) {
    const contentBlock = document.getElementById(`modal-${categoryId}`)
    if (!contentBlock) return
    // Inject raw HTML to avoid copying hidden attribute & duplicate IDs
    modalBody.innerHTML = contentBlock.innerHTML
    const heading = modalBody.querySelector('h1,h2,h3')
    if (heading) heading.id = 'modal-heading'
    lastFocused = document.activeElement
    modal.removeAttribute('hidden')
    document.documentElement.style.overflow = 'hidden'
    gsap.set(modalBody, { y: 40, autoAlpha: 0 })
    tl.play(0)
    setTimeout(() => (heading ? heading.focus?.() : closeBtn.focus()), 30)
    modal.scrollTop = 0
  }

  function closeModal() {
    if (modal.hasAttribute('hidden')) return
    tl.reverse().eventCallback('onReverseComplete', () => {
      modal.setAttribute('hidden', '')
      document.documentElement.style.overflow = ''
      if (lastFocused) lastFocused.focus()
    })
  }

  closeBtn.addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
    if (e.key === 'Tab' && !modal.hasAttribute('hidden')) {
      const focusable = modal.querySelectorAll('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')
      const list = Array.from(focusable)
      if (!list.length) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
  })

  document.querySelectorAll('a[href^="#privatperson"],a[href^="#unternehmer"],a[href^="#freiberufler"],a[href^="#aerzte"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault()
      openModal(link.getAttribute('href').substring(1))
    })
  })
}
