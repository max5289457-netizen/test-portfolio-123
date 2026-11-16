const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const sectionLinks = document.querySelectorAll('a[href^="#"]');
const themeToggle = document.getElementById('themeToggle');
const filterButtons = document.querySelectorAll('.filter-button');
const portfolioFilterControls = document.querySelector('.portfolio-filter-controls');
const categoryStepButtons = document.querySelectorAll('.category-step-button');
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

let modalItems = [];
let modalIndex = 0;
let modalReturnFocus = null;
let previousBodyOverflow = '';
let navScrollFrame = 0;
let previousScrollBehavior = null;

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (themeToggle) {
  const updateThemeControl = () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const label = isDark ? 'Включить светлую тему' : 'Включить тёмную тему';
    themeToggle.classList.toggle('is-dark', isDark);
    themeToggle.setAttribute('aria-checked', String(isDark));
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
  };

  updateThemeControl();
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    updateThemeControl();

    try {
      localStorage.setItem('max-portfolio-theme', nextTheme);
    } catch {
      // The current page theme still changes when storage is unavailable.
    }
  });
}

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

const cancelNavScroll = () => {
  if (navScrollFrame) cancelAnimationFrame(navScrollFrame);
  navScrollFrame = 0;

  if (previousScrollBehavior !== null) {
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    previousScrollBehavior = null;
  }
};

const scrollToSection = (target) => {
  cancelNavScroll();

  const root = document.documentElement;
  const startPosition = window.scrollY;
  const scrollMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const targetPosition = Math.max(
    0,
    startPosition + target.getBoundingClientRect().top - scrollMargin
  );
  const distance = targetPosition - startPosition;

  if (Math.abs(distance) < 1) return;

  previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';

  const duration = Math.min(1000, Math.max(450, Math.abs(distance) * 0.25));
  let startTime = null;

  const animateScroll = (time) => {
    if (startTime === null) startTime = time;

    const progress = Math.min((time - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, startPosition + distance * easedProgress);

    if (progress < 1) {
      navScrollFrame = requestAnimationFrame(animateScroll);
    } else {
      cancelNavScroll();
    }
  };

  navScrollFrame = requestAnimationFrame(animateScroll);
};

window.addEventListener('wheel', cancelNavScroll, { passive: true });
window.addEventListener('touchstart', cancelNavScroll, { passive: true });

sectionLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = targetId ? document.querySelector(targetId) : null;

    if (target) {
      event.preventDefault();
      scrollToSection(target);
    }

    if (navToggle && mainNav && mainNav.contains(link)) {
      mainNav.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

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
const stepThroughCategories = (direction) => {
  if (!filterButtons.length) return;

  const activeIndex = Array.from(filterButtons).findIndex((button) => button.classList.contains('active'));
  const nextIndex = (activeIndex + direction + filterButtons.length) % filterButtons.length;
  const nextButton = filterButtons[nextIndex];

  nextButton.click();
  nextButton.focus({ preventScroll: true });
};

categoryStepButtons.forEach((button) => {
  button.addEventListener('click', () => stepThroughCategories(Number(button.dataset.direction)));
});

portfolioFilterControls?.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

  event.preventDefault();
  stepThroughCategories(event.key === 'ArrowRight' ? 1 : -1);
});

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

const updateModalImage = (direction = 0) => {
  if (!modalItems.length) return;

  const item = modalItems[modalIndex];
  modalImage.src = item.src;
  modalTitle.textContent = item.title;
  modalCategory.textContent = item.category;
  modalDescription.textContent = item.description;
  modalImage.alt = `${item.title}, изображение ${modalIndex + 1} из ${modalItems.length}`;

  if (
    direction &&
    typeof modalImage.animate === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    modalImage.animate(
      [
        { opacity: 0.55, transform: `translateX(${direction * 18}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ],
      { duration: 200, easing: 'ease-out' }
    );
  }

  modalThumbnails?.querySelectorAll('button').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === modalIndex));
  });
};

const openProjectModal = (card) => {
  if (!modal || !modalImage || !modalTitle || !modalCategory || !modalDescription) return;

  const cards = card.dataset.category === 'marketplace'
    ? Array.from(projectCards).filter((projectCard) => projectCard.dataset.category === 'marketplace')
    : [card];

  modalItems = cards.flatMap((projectCard) => {
    const cardImage = projectCard.querySelector('.project-thumb img');
    const imagePaths = (projectCard.dataset.images || cardImage?.getAttribute('src') || '').split('|').filter(Boolean);
    const item = {
      title: projectCard.dataset.title || 'Название проекта',
      category: projectCard.querySelector('.project-tag')?.textContent || 'Проект',
      description: projectCard.dataset.description || 'Описание проекта'
    };

    return imagePaths.map((src) => ({ ...item, src }));
  });
  if (!modalItems.length) return;

  modalReturnFocus = card;
  previousBodyOverflow = document.body.style.overflow;
  modalIndex = 0;
  modalThumbnails?.replaceChildren();

  modalItems.forEach((item, index) => {
    const thumbnailButton = document.createElement('button');
    const thumbnailImage = document.createElement('img');
    thumbnailButton.type = 'button';
    thumbnailButton.className = 'modal-thumbnail';
    thumbnailButton.setAttribute('aria-label', `Показать изображение ${index + 1}: ${item.title}`);
    thumbnailButton.setAttribute('aria-pressed', String(index === 0));
    thumbnailImage.src = item.src;
    thumbnailImage.alt = '';
    thumbnailButton.append(thumbnailImage);
    thumbnailButton.addEventListener('click', () => {
      const direction = Math.sign(index - modalIndex);
      modalIndex = index;
      updateModalImage(direction);
    });
    modalThumbnails?.append(thumbnailButton);
  });

  const hasGallery = modalItems.length > 1;
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
  modalIndex = (modalIndex - 1 + modalItems.length) % modalItems.length;
  updateModalImage(-1);
});

modalNext?.addEventListener('click', () => {
  modalIndex = (modalIndex + 1) % modalItems.length;
  updateModalImage(1);
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
  if (event.key === 'ArrowRight' && modalItems.length > 1) {
    modalIndex = (modalIndex + 1) % modalItems.length;
    updateModalImage(1);
    return;
  }
  if (event.key === 'ArrowLeft' && modalItems.length > 1) {
    modalIndex = (modalIndex - 1 + modalItems.length) % modalItems.length;
    updateModalImage(-1);
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

