// Галерея с Lightbox
let currentImageIndex = 0;
let portfolioImages = [];
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация портфолио картинок
    initPortfolioGallery();
    
    // Инициализация категорий портфолио
    initCategoryFolders();
    
    // Обработчики для Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const lightboxContent = document.querySelector('.lightbox-content');
    
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);
    
    // Обработчики для свайпа
    lightboxContent.addEventListener('touchstart', handleSwipeStart, false);
    lightboxContent.addEventListener('touchend', handleSwipeEnd, false);
    
    // Закрытие при клике на фон
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Навигация с клавиатурой
    document.addEventListener('keydown', function(e) {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'Escape') closeLightbox();
        }
    });
});

function handleSwipeStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleSwipeEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Свайп влево — показать следующую картинку
            showNextImage();
        } else {
            // Свайп вправо — показать предыдущую картинку
            showPrevImage();
        }
    }
}

function initPortfolioGallery() {
    // Собираем все картинки портфолио (включая те что в папках)
    const images = document.querySelectorAll('.portfolio-image img');
    portfolioImages = Array.from(images).map(img => ({
        src: img.src,
        alt: img.alt
    }));
    
    images.forEach((img, index) => {
        img.addEventListener('click', function() {
            openLightbox(index);
        });
    });
}

function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    
    lightboxImage.src = portfolioImages[index].src;
    lightboxImage.alt = portfolioImages[index].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % portfolioImages.length;
    const lightboxImage = document.getElementById('lightbox-image');
    lightboxImage.src = portfolioImages[currentImageIndex].src;
    lightboxImage.alt = portfolioImages[currentImageIndex].alt;
}

function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + portfolioImages.length) % portfolioImages.length;
    const lightboxImage = document.getElementById('lightbox-image');
    lightboxImage.src = portfolioImages[currentImageIndex].src;
    lightboxImage.alt = portfolioImages[currentImageIndex].alt;
}

// Плавный скролл для навигационных ссылок
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (href !== '#' && target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Добавляем эффект при прокрутке страницы
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// Обработка формы контакта через Telegram Bot
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    // Обработчик для отправки при Enter в полях ввода (кроме textarea)
    const inputs = contactForm.querySelectorAll('input[type="text"], input[type="email"]');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                contactForm.dispatchEvent(new Event('submit'));
            }
        });
    });
    
    // Для textarea: Ctrl+Enter отправляет форму
    const textarea = contactForm.querySelector('textarea');
    if (textarea) {
        textarea.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                contactForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
        
        try {
            const name = this.querySelector('input[name="name"]').value;
            const email = this.querySelector('input[name="email"]').value;
            const message = this.querySelector('textarea[name="message"]').value;
            const timestamp = new Date().toLocaleString('ru-RU');
            
            // Формируем текст сообщения
            const telegramMessage = `<b>📝 Новая заявка с портфолио</b>

<b>👤 Имя:</b> ${name}
<b>📧 Email:</b> ${email}
<b>💬 Сообщение:</b>
${message}

<b>⏰ Время:</b> ${timestamp}`;
            
            // Отправляем через Telegram Bot API
            const botToken = '8464552761:AAEatg3iVHcWf9iMo5xX_f2v17Euj2-5Yd8';
            const chatId = '763637481';
            
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: telegramMessage,
                    parse_mode: 'HTML'
                })
            });
            
            const data = await response.json();
            
            if (data.ok) {
                alert('✅ Спасибо! Заявка отправлена. Я свяжусь с вами в ближайшее время.');
                this.reset();
                submitBtn.textContent = 'Отправлено!';
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error(data.description || 'Ошибка отправки');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('⚠️ Ошибка: ' + error.message + '\n\nНапишите на: max5289457@gmail.com');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Инициализация категорий портфолио (раскрывающиеся папки)
function initCategoryFolders() {
    const folders = document.querySelectorAll('.category-folder');
    
    folders.forEach(folder => {
        const header = folder.querySelector('.folder-header');
        const content = folder.querySelector('.folder-content');
        
        header.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Закрыть все остальные папки
            folders.forEach(f => {
                if (f !== folder) {
                    f.classList.remove('open');
                    f.querySelector('.folder-content').style.display = 'none';
                }
            });
            
            // Открыть/закрыть текущую папку
            folder.classList.toggle('open');
            if (content.style.display === 'none') {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });
        
        // Инициализация галереи в этой папке
        const images = content.querySelectorAll('.portfolio-image img');
        images.forEach((img, index) => {
            img.addEventListener('click', function() {
                // Пересчитываем индекс с учётом всех картинок
                const allImages = document.querySelectorAll('.portfolio-image img');
                let globalIndex = 0;
                for (let i = 0; i < allImages.length; i++) {
                    if (allImages[i] === img) {
                        globalIndex = i;
                        break;
                    }
                }
                openLightbox(globalIndex);
            });
        });
    });
}
