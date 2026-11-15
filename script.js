const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const filterButtons = document.querySelectorAll('.filter-button');
const projectCards = document.querySelectorAll('.project-card');
const currentYear = document.getElementById('currentYear');
const leadForm = document.getElementById('leadForm');
const formStatus = document.getElementById('formStatus');
const modal = document.getElementById('projectModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalDescription = document.getElementById('modalDescription');
const modalClose = document.querySelector('.modal-close');
const modalPrev = document.querySelector('.modal-prev');
const modalNext = document.querySelector('.modal-next');

let modalImages = [];
let modalIndex = 0;

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const sections = document.querySelectorAll('section[id]');
const navMap = Array.from(navLinks).reduce((obj, link) => {
  obj[link.getAttribute('href')] = link;
  return obj;
}, {});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      if (navMap[id]) {
        navLinks.forEach((link) => link.classList.toggle('active', link === navMap[id]));
      }
    });
  },
  { threshold: 0.45 }
);

sections.forEach((section) => observer.observe(section));

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle('active', item === button));

    projectCards.forEach((card) => {
      const matches = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !matches);
    });
  });
});

const openProjectModal = (card) => {
  const images = card.dataset.images ? card.dataset.images.split('|') : [card.querySelector('img').src];
  modalImages = images.filter(Boolean);
  modalIndex = 0;
  modalTitle.textContent = card.dataset.title || 'Название проекта';
  modalCategory.textContent = card.dataset.category || 'Проект';
  modalDescription.textContent = card.dataset.description || 'Описание проекта';
  updateModalImage();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeProjectModal = () => {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

const updateModalImage = () => {
  if (!modalImages.length) return;
  const imagePath = modalImages[modalIndex];
  modalImage.src = imagePath;
  modalImage.alt = modalTitle.textContent;
};

projectCards.forEach((card) => {
  const image = card.querySelector('img');
  if (image) {
    image.addEventListener('click', () => openProjectModal(card));
  }

  card.addEventListener('click', (event) => {
    if (event.target === card || event.target.closest('.project-body')) {
      openProjectModal(card);
    }
  });
});

if (modalClose) {
  modalClose.addEventListener('click', closeProjectModal);
}

if (modalPrev) {
  modalPrev.addEventListener('click', () => {
    modalIndex = (modalIndex - 1 + modalImages.length) % modalImages.length;
    updateModalImage();
  });
}

if (modalNext) {
  modalNext.addEventListener('click', () => {
    modalIndex = (modalIndex + 1) % modalImages.length;
    updateModalImage();
  });
}

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeProjectModal();
  });
}

document.addEventListener('keydown', (event) => {
  if (!modal.classList.contains('is-open')) return;

  if (event.key === 'Escape') closeProjectModal();
  if (event.key === 'ArrowRight') {
    modalIndex = (modalIndex + 1) % modalImages.length;
    updateModalImage();
  }
  if (event.key === 'ArrowLeft') {
    modalIndex = (modalIndex - 1 + modalImages.length) % modalImages.length;
    updateModalImage();
  }
});

if (leadForm) {
  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = leadForm.querySelector('.submit-button');
    const payload = Object.fromEntries(new FormData(leadForm).entries());

    if (!payload.name || !payload.contact || !payload.projectType || !payload.description) {
      formStatus.textContent = 'Заполните обязательные поля.';
      formStatus.classList.add('error');
      formStatus.classList.remove('success');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';
    formStatus.textContent = '';
    formStatus.classList.remove('error', 'success');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Не удалось отправить заявку.');
      }

      formStatus.textContent = result.message;
      formStatus.classList.add('success');
      formStatus.classList.remove('error');
      leadForm.reset();
    } catch (error) {
      formStatus.textContent = error.message;
      formStatus.classList.add('error');
      formStatus.classList.remove('success');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Отправить заявку';
    }
  });
}

