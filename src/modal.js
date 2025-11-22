export function initModal() {
  // Create modal element
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" aria-label="Close modal">&times;</button>
      <div class="modal-body"></div>
    </div>
  `;
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
      
      // Set modal content based on category
      modalBody.innerHTML = getModalContent(category);
      
      // Show modal
      modal.classList.add('active');
    });
  });
}

function getModalContent(category) {
  const content = {
    privatperson: {
      title: 'Arbeitnehmer / Privatperson',
      description: 'Individuelle Steuerberatung für Arbeitnehmer und Privatpersonen',
      sections: [
        'Einkommensteuererklärung',
        'Steueroptimierung',
        'Vermögensplanung',
        'Altersvorsorge'
      ]
    },
    unternehmer: {
      title: 'Unternehmer',
      description: 'Umfassende Beratung für Unternehmer und Gewerbetreibende',
      sections: [
        'Jahresabschluss',
        'Betriebswirtschaftliche Auswertungen',
        'Steuerplanung',
        'Unternehmensberatung'
      ]
    },
    freiberufler: {
      title: 'Freiberufler',
      description: 'Spezialisierte Betreuung für Freiberufler',
      sections: [
        'Einnahmen-Überschuss-Rechnung',
        'Gewinnermittlung',
        'Umsatzsteuer',
        'Vorsorgeplanung'
      ]
    },
    aerzte: {
      title: 'Ärzte',
      description: 'Fachkundige Beratung für medizinische Berufe',
      sections: [
        'Praxisgründung',
        'Praxisabgabe',
        'Abrechnungswesen',
        'Investitionsplanung'
      ]
    }
  };

  const data = content[category] || content.privatperson;

  return `
    <h2 class="text-brand font-semibold text-lg mb-2">${data.title}</h2>
    <h1 class="font-brand text-5xl mb-8">${data.description}</h1>
    <div class="space-y-4">
      ${data.sections.map(section => `
        <div class="border-l-4 border-brand pl-4 py-2">
          <h3 class="text-xl font-semibold">${section}</h3>
        </div>
      `).join('')}
    </div>
    <div class="mt-12">
      <a href="#kontakt" class="button inline-block">Jetzt Beratung anfragen</a>
    </div>
  `;
}
