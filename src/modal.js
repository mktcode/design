export function initModal() {
  // Clone modal template
  const modalTemplate = document.getElementById('modal-template');
  const modal = modalTemplate.content.cloneNode(true).querySelector('.modal');
  document.body.appendChild(modal);

  const modalBody = modal.querySelector('.modal-body');
  const closeBtn = modal.querySelector('.modal-close');

  // Close modal function
  function closeModal() {
    modal.classList.remove('active');
  }

  // Close on button click
  closeBtn.addEventListener('click', closeModal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Handle link clicks
  const categoryLinks = document.querySelectorAll('a[href^="#privatperson"], a[href^="#unternehmer"], a[href^="#freiberufler"], a[href^="#aerzte"]');
  
  categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const category = link.getAttribute('href').substring(1);
      
      // Get content from template
      const contentTemplate = document.getElementById(`modal-${category}`);
      if (contentTemplate) {
        modalBody.innerHTML = '';
        modalBody.appendChild(contentTemplate.content.cloneNode(true));
      }
      
      // Show modal
      modal.classList.add('active');
    });
  });
}
