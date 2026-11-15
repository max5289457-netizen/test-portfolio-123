const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const filterButtons = document.querySelectorAll('.filter-button');
const projectCards = document.querySelectorAll('.project-card');
const portfolioEmpty = document.getElementById('portfolioEmpty');
const currentYear = document.getElementById('currentYear');
const leadForm = document.getElementById('leadForm');
const formStatus = document.getElementById('formStatus');
const modal = document.getElementById('projectModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalDescription = document.getElementById('modalDescription');
const modalThumbnails = document.getElementById('modalThumbnails');
const modalClose = document.querySelector('.modal-close');
const modalPrev = document.querySelector('.modal-prev');
const modalNext = document.querySelector('.modal-next');

let modalImages = [];
let modalIndex = 0;
let modalReturnFocus = null;
let previousBodyOverflow = '';

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

// Keep category keys aligned with data-category and announce empty filters without leaving a blank grid.
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    let visibleCount = 0;

    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });

    projectCards.forEach((card) => {
      const matches = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !matches);
      if (matches) visibleCount += 1;
    });

    if (portfolioEmpty) portfolioEmpty.hidden = visibleCount > 0;
  });
});

const updateModalImage = () => {
  if (!modalImages.length) return;

  modalImage.src = modalImages[modalIndex];
  modalImage.alt = `${modalTitle.textContent}, изображение ${modalIndex + 1}`;

  modalThumbnails?.querySelectorAll('button').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === modalIndex));
  });
};

const openProjectModal = (card) => {
  if (!modal || !modalImage || !modalTitle || !modalCategory || !modalDescription) return;

  const cardImage = card.querySelector('.project-thumb img');
  modalImages = (card.dataset.images || cardImage?.getAttribute('src') || '').split('|').filter(Boolean);
  if (!modalImages.length) return;

  modalReturnFocus = card;
  previousBodyOverflow = document.body.style.overflow;
  modalIndex = 0;
  modalTitle.textContent = card.dataset.title || 'Название проекта';
  modalCategory.textContent = card.querySelector('.project-tag')?.textContent || 'Проект';
  modalDescription.textContent = card.dataset.description || 'Описание проекта';
  modalThumbnails?.replaceChildren();

  modalImages.forEach((imagePath, index) => {
    const thumbnailButton = document.createElement('button');
    const thumbnailImage = document.createElement('img');
    thumbnailButton.type = 'button';
    thumbnailButton.className = 'modal-thumbnail';
    thumbnailButton.setAttribute('aria-label', `Показать изображение ${index + 1}`);
    thumbnailButton.setAttribute('aria-pressed', String(index === 0));
    thumbnailImage.src = imagePath;
    thumbnailImage.alt = '';
    thumbnailButton.append(thumbnailImage);
    thumbnailButton.addEventListener('click', () => {
      modalIndex = index;
      updateModalImage();
    });
    modalThumbnails?.append(thumbnailButton);
  });

  const hasGallery = modalImages.length > 1;
  if (modalPrev) modalPrev.hidden = !hasGallery;
  if (modalNext) modalNext.hidden = !hasGallery;
  if (modalThumbnails) modalThumbnails.hidden = !hasGallery;

  updateModalImage();
  projectCards.forEach((projectCard) => projectCard.setAttribute('aria-expanded', String(projectCard === card)));
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => modalClose?.focus({ preventScroll: true }), 0);
};

const closeProjectModal = () => {
  if (!modal?.classList.contains('is-open')) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = previousBodyOverflow;
  const focusTarget = modalReturnFocus;
  modalReturnFocus = null;
  focusTarget?.setAttribute('aria-expanded', 'false');
  focusTarget?.focus({ preventScroll: true });
};

// Cards use custom button semantics, so mouse/keyboard activation and dialog focus return are explicit.
projectCards.forEach((card) => {
  card.addEventListener('click', () => openProjectModal(card));
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!event.repeat) openProjectModal(card);
  });
});

modalClose?.addEventListener('click', closeProjectModal);

modalPrev?.addEventListener('click', () => {
  modalIndex = (modalIndex - 1 + modalImages.length) % modalImages.length;
  updateModalImage();
});

modalNext?.addEventListener('click', () => {
  modalIndex = (modalIndex + 1) % modalImages.length;
  updateModalImage();
});

modal?.addEventListener('click', (event) => {
  if (event.target === modal) closeProjectModal();
});

document.addEventListener('keydown', (event) => {
  if (!modal?.classList.contains('is-open')) return;

  if (event.key === 'Escape') {
    closeProjectModal();
    return;
  }
  if (event.key === 'ArrowRight' && modalImages.length > 1) {
    modalIndex = (modalIndex + 1) % modalImages.length;
    updateModalImage();
    return;
  }
  if (event.key === 'ArrowLeft' && modalImages.length > 1) {
    modalIndex = (modalIndex - 1 + modalImages.length) % modalImages.length;
    updateModalImage();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = [...modal.querySelectorAll('button:not([disabled]):not([hidden])')]
    .filter((element) => element.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
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

