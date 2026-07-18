console.log('📦 main.js загружен');

// ============================================
// ЖЕЛАЕМОЕ (через localStorage)
// ============================================

// Получить список желаемого из localStorage
function getWishlistFromStorage() {
    try {
        const data = localStorage.getItem('wishlist');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Ошибка чтения wishlist:', error);
        return [];
    }
}

// Сохранить желаемое в localStorage
function saveWishlistToStorage(items) {
    try {
        localStorage.setItem('wishlist', JSON.stringify(items));
    } catch (error) {
        console.error('Ошибка сохранения wishlist:', error);
    }
}

// Добавить в желаемое
async function addToWishlist(productId) {
    console.log('❤️ Добавление в желаемое:', productId);
    
    // Получаем текущий список
    let wishlist = getWishlistFromStorage();
    
    // Проверяем, есть ли уже
    if (wishlist.includes(parseInt(productId))) {
        showNotification('Уже в желаемом', 'info');
        return;
    }
    
    // Добавляем
    wishlist.push(parseInt(productId));
    saveWishlistToStorage(wishlist);
    
    // Обновляем UI
    updateWishlistUI(productId, true);
    updateWishlistCounter(wishlist.length);
    showNotification('Добавлено в желаемое ❤️', 'success');
}

// Удалить из желаемого
async function removeFromWishlist(productId) {
    console.log('🗑️ Удаление из желаемого:', productId);
    
    // Получаем текущий список
    let wishlist = getWishlistFromStorage();
    
    // Удаляем
    wishlist = wishlist.filter(id => id !== parseInt(productId));
    saveWishlistToStorage(wishlist);
    
    // Обновляем UI
    updateWishlistUI(productId, false);
    updateWishlistCounter(wishlist.length);
    showNotification('Удалено из желаемого', 'success');
    
    // Если на странице желаемого, перезагружаем
    if (window.location.pathname === '/wishlist') {
        location.reload();
    }
}

// Проверить, есть ли товар в желаемом
function isInWishlist(productId) {
    const wishlist = getWishlistFromStorage();
    return wishlist.includes(parseInt(productId));
}

// Обновить UI кнопки
function updateWishlistUI(productId, isIn) {
    const btns = document.querySelectorAll(`.add-to-wishlist[data-id="${productId}"]`);
    btns.forEach(btn => {
        if (isIn) {
            btn.textContent = '❤️ В желаемом';
            btn.classList.add('in-wishlist');
        } else {
            btn.textContent = '❤️ В желаемое';
            btn.classList.remove('in-wishlist');
        }
    });
}

// Обновить все кнопки на странице
function updateAllWishlistButtons() {
    const wishlist = getWishlistFromStorage();
    document.querySelectorAll('.add-to-wishlist').forEach(btn => {
        const id = parseInt(btn.dataset.id);
        if (wishlist.includes(id)) {
            btn.textContent = '❤️ В желаемом';
            btn.classList.add('in-wishlist');
        } else {
            btn.textContent = '❤️ В желаемое';
            btn.classList.remove('in-wishlist');
        }
    });
}

// Обновление счетчика
function updateWishlistCounter(count) {
    console.log('🔄 Обновление счетчика:', count);
    document.querySelectorAll('.wishlist-count').forEach(el => {
        el.textContent = count || 0;
    });
}

// Получить количество
function getWishlistCount() {
    return getWishlistFromStorage().length;
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
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Страница загружена');
    
    // Обновляем все кнопки
    updateAllWishlistButtons();
    
    // Обновляем счетчик
    updateWishlistCounter(getWishlistCount());
    
    // Кнопки "В желаемое"
    document.querySelectorAll('.add-to-wishlist').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.id;
            if (productId) {
                const wishlist = getWishlistFromStorage();
                if (wishlist.includes(parseInt(productId))) {
                    removeFromWishlist(productId);
                } else {
                    addToWishlist(productId);
                }
            }
        });
    });
    
    // Кнопки удаления на странице желаемого
    document.querySelectorAll('.remove-from-wishlist').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.id;
            if (productId) {
                removeFromWishlist(productId);
            }
        });
    });
    
    // Слайдер
    initSlider();
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
        prevBtn.addEventListener('click', function() {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const itemsPerView = getItemsPerView();
            const maxIndex = Math.max(0, items.length - itemsPerView);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateSlider();
            }
        });
    }
    
    let resizeTimeout;
    window.addEventListener('resize', function() {
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