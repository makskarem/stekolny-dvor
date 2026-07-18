console.log('📦 main.js загружен');

// ============================================
// ЖЕЛАЕМОЕ
// ============================================

// Добавление в желаемое
async function addToWishlist(productId) {
    console.log('❤️ Добавление в желаемое:', productId);

    try {
        const response = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id: productId })
        });

        const data = await response.json();
        console.log('📦 Ответ:', data);

        if (data.success) {
            updateWishlistCounter(data.count);
            const btn = document.querySelector(`.add-to-wishlist[data-id="${productId}"]`);
            if (btn) {
                btn.textContent = data.exists ? '❤️ В желаемом' : '❤️ В желаемое';
                btn.classList.toggle('in-wishlist', data.exists);
            }
            showNotification(data.message, 'success');
        } else {
            showNotification(data.message || 'Ошибка', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showNotification('Ошибка добавления в желаемое', 'error');
    }
}

// Удаление из желаемого
async function removeFromWishlist(productId) {
    console.log('🗑️ Удаление из желаемого:', productId);

    try {
        const response = await fetch(`/api/wishlist/remove/${productId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            // Удаляем элемент из списка
            const item = document.querySelector(`.wishlist-item[data-id="${productId}"]`);
            if (item) {
                item.remove();
            }
            // Обновляем счетчик
            updateWishlistCounter(data.count);
            // Обновляем кнопку на странице товара
            const btn = document.querySelector(`.add-to-wishlist[data-id="${productId}"]`);
            if (btn) {
                btn.textContent = '❤️ В желаемое';
                btn.classList.remove('in-wishlist');
            }
            showNotification('Удалено из желаемого', 'success');

            // Если больше нет товаров, перезагружаем страницу
            if (document.querySelectorAll('.wishlist-item').length === 0) {
                location.reload();
            }
        } else {
            showNotification(data.message || 'Ошибка удаления', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showNotification('Ошибка удаления из желаемого', 'error');
    }
}

// Обновление счетчика желаемого
function updateWishlistCounter(count) {
    console.log('🔄 Обновление счетчика:', count);
    document.querySelectorAll('.wishlist-count').forEach(el => {
        el.textContent = count || 0;
    });
}

// Получение количества
async function fetchWishlistCount() {
    try {
        const response = await fetch('/api/wishlist/count');
        const data = await response.json();
        if (data.count !== undefined) {
            updateWishlistCounter(data.count);
        }
    } catch (error) {
        console.error('Ошибка получения количества:', error);
    }
}

// ============================================
// УВЕДОМЛЕНИЯ
// ============================================

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: #fff;
        border-radius: 8px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 Страница загружена');

    // Кнопки "В желаемое"
    document.querySelectorAll('.add-to-wishlist').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const productId = this.dataset.id;
            if (productId) {
                addToWishlist(productId);
            }
        });
    });

    // Кнопки удаления из желаемого
    document.querySelectorAll('.remove-from-wishlist').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const productId = this.dataset.id;
            if (productId) {
                removeFromWishlist(productId);
            }
        });
    });

    // Слайдер
    initSlider();

    // Загружаем количество
    fetchWishlistCount();
});

// ============================================
// СЛАЙДЕР
// ============================================

function initSlider() {
    const container = document.querySelector('.slider-container');
    if (!container) return;

    const track = container.querySelector('.slider-track');
    const items = container.querySelectorAll('.slider-item');
    const prevBtn = container.querySelector('.slider-btn.prev');
    const nextBtn = container.querySelector('.slider-btn.next');

    if (!track || items.length === 0) return;

    let currentIndex = 0;

    function getItemsPerView() {
        const width = window.innerWidth;
        if (width < 480) return 1;
        if (width < 768) return 2;
        if (width < 1024) return 3;
        return 4;
    }

    function updateSlider() {
        const itemsPerView = getItemsPerView();
        const maxIndex = Math.max(0, items.length - itemsPerView);
        if (currentIndex > maxIndex) currentIndex = maxIndex;

        const itemWidth = items[0].offsetWidth + 20;
        const offset = currentIndex * itemWidth;
        track.style.transform = `translateX(-${offset}px)`;

        if (prevBtn) {
            prevBtn.style.display = currentIndex === 0 ? 'none' : 'block';
        }
        if (nextBtn) {
            nextBtn.style.display = currentIndex >= maxIndex ? 'none' : 'block';
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            const itemsPerView = getItemsPerView();
            const maxIndex = Math.max(0, items.length - itemsPerView);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateSlider();
            }
        });
    }

    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateSlider, 200);
    });

    setTimeout(updateSlider, 100);
}

// Стили для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(style);

console.log('✅ main.js загружен');