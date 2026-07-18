const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const SQLiteStore = require('connect-sqlite3')(session);
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 START SERVER (упрощенная версия)');

// Подключение к базе данных
const db = require('./config/database');

// ============================================
// ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ - СОЗДАНИЕ ТАБЛИЦ
// ============================================
// Создание таблицы wishlist, если её нет
db.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, product_id)
    )
`, (err) => {
    if (err) {
        console.error('❌ Ошибка создания таблицы wishlist:', err.message);
    } else {
        console.log('✅ Таблица wishlist создана/проверена');
    }
});

// Создание таблицы для заказов (если нужна)
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        products TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'new',
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('❌ Ошибка создания таблицы orders:', err.message);
    } else {
        console.log('✅ Таблица orders создана/проверена');
    }
});

// Импорт моделей
const Wishlist = require('./models/Wishlist');

// Импорт контроллера
const mainController = require('./controllers/mainController');

// Настройка EJS с layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ============================================
// ХЕЛПЕР ДЛЯ ПОЛУЧЕНИЯ ПЕРВОГО ИЗОБРАЖЕНИЯ
// ============================================
app.locals.getFirstImage = function (product) {
    if (!product) return '/images/placeholder.jpg';

    // Проверяем поле images (JSON массив)
    if (product.images) {
        try {
            const images = JSON.parse(product.images);
            if (Array.isArray(images) && images.length > 0) {
                return images[0];
            }
        } catch (e) {
            // Если не удалось распарсить
        }
    }

    // Если есть image_url (старое поле)
    if (product.image_url) {
        return product.image_url;
    }

    return '/images/placeholder.jpg';
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Настройка сессий
const sessionStore = new SQLiteStore({
    db: 'sessions.sqlite',
    table: 'sessions',
    concurrentDB: true
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'my-super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
}));

// Middleware для передачи данных о пользователе
app.use((req, res, next) => {
    res.locals.user = req.session?.user || null;
    res.locals.path = req.path;
    next();
});

// Middleware для wishlistCount на всех страницах
app.use(async (req, res, next) => {
    try {
        const sessionId = req.session?.id;
        if (sessionId) {
            const count = await Wishlist.getCount(sessionId);
            res.locals.wishlistCount = count || 0;
        } else {
            res.locals.wishlistCount = 0;
        }
    } catch (error) {
        console.error('❌ Ошибка получения wishlistCount:', error);
        res.locals.wishlistCount = 0;
    }
    next();
});



// ============================================
// НАСТРОЙКА MULTER ДЛЯ ЗАГРУЗКИ ФАЙЛОВ
// ============================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve(__dirname, '../uploads/products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый формат файла'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});


// Настройка EJS с layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ============================================
// ХЕЛПЕР ДЛЯ ПОЛУЧЕНИЯ ПЕРВОГО ИЗОБРАЖЕНИЯ
// ============================================
app.locals.getFirstImage = function (product) {
    if (!product) return '/images/placeholder.jpg';

    // Проверяем поле images (JSON массив)
    if (product.images) {
        try {
            const images = JSON.parse(product.images);
            if (Array.isArray(images) && images.length > 0) {
                return images[0];
            }
        } catch (e) {
            // Если не удалось распарсить
        }
    }

    // Если есть image_url (старое поле)
    if (product.image_url) {
        return product.image_url;
    }

    return '/images/placeholder.jpg';
};

// ============================================
// МАРШРУТЫ
// ============================================

console.log('📋 Регистрация маршрутов...');

// Основные страницы
app.get('/', mainController.index);
app.get('/catalog', mainController.catalog);
app.get('/catalog/:slug', mainController.productDetail);
app.get('/about', mainController.about);
app.get('/contacts', mainController.contacts);

// Вход для админа
app.get('/login', (req, res) => {
    res.render('pages/login', {
        title: 'Вход для администратора',
        error: null,
        user: null
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@stekolnyi-dvor.ru' && password === 'admin123') {
        req.session.user = {
            id: 1,
            email: email,
            username: 'admin',
            full_name: 'Администратор',
            is_admin: true
        };
        req.session.save((err) => {
            if (err) console.error('❌ Ошибка сохранения сессии:', err);
            res.redirect('/admin');
        });
    } else {
        res.render('pages/login', {
            title: 'Вход для администратора',
            error: 'Неверный email или пароль',
            user: null
        });
    }
});

// Выход
app.get('/logout', (req, res) => {
    console.log('👋 Выход из системы');
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Ошибка выхода:', err);
        }
        res.redirect('/');
    });
});

// Желаемое
app.get('/wishlist', mainController.wishlist);
app.get('/api/wishlist/count', mainController.wishlistCount);
app.post('/api/wishlist/add', mainController.addToWishlist);
app.delete('/api/wishlist/remove/:product_id', mainController.removeFromWishlist);

// Форма заказа звонка
app.post('/api/call-request', mainController.callRequest);

// ============================================
// АДМИНКА - с проверкой сессии перед загрузкой
// ============================================

// Middleware для проверки админа
function isAdmin(req, res, next) {
    if (!req.session || !req.session.user || !req.session.user.is_admin) {
        return res.redirect('/login');
    }
    next();
}

// Страницы админки (без загрузки файлов)
app.get('/admin', isAdmin, mainController.admin);
app.get('/admin/products', isAdmin, mainController.adminProducts);
app.get('/admin/products/add', isAdmin, mainController.adminProductAdd);
app.get('/admin/products/edit/:id', isAdmin, mainController.adminProductEdit);
app.get('/admin/categories', isAdmin, mainController.adminCategories);
app.get('/admin/orders', isAdmin, mainController.adminOrders);
app.get('/admin/orders/:id', isAdmin, mainController.adminOrderDetail);

// POST маршруты с загрузкой файлов (с проверкой админа)
app.post('/admin/products/add', isAdmin, upload.array('images', 10), mainController.adminProductAddPost);
app.post('/admin/products/edit/:id', isAdmin, upload.array('images', 10), mainController.adminProductEditPost);
app.post('/admin/products/delete/:id', isAdmin, mainController.adminProductDelete);
app.post('/admin/products/remove-image/:id/:index', isAdmin, mainController.adminProductRemoveImage);
app.post('/admin/categories/add', isAdmin, mainController.adminCategoryAdd);
app.post('/admin/categories/edit/:id', isAdmin, mainController.adminCategoryEdit);
app.post('/admin/categories/delete/:id', isAdmin, mainController.adminCategoryDelete);
app.post('/admin/orders/update-status/:id', isAdmin, mainController.adminOrderUpdateStatus);

// API для формы обратной связи
app.post('/api/contact', async (req, res) => {
    const { name, phone, email, message } = req.body;

    console.log('📨 Новое сообщение с сайта:');
    console.log(`   Имя: ${name}`);
    console.log(`   Телефон: ${phone}`);
    console.log(`   Email: ${email || 'Не указан'}`);
    console.log(`   Сообщение: ${message}`);

    // Формируем HTML письма
    const html = `
        <h2>📨 Новое сообщение с сайта "Стекольный двор"</h2>
        <p><strong>Имя:</strong> ${name}</p>
        <p><strong>Телефон:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email || 'Не указан'}</p>
        <p><strong>Сообщение:</strong></p>
        <pre>${message}</pre>
        <hr>
        <p><small>Сообщение отправлено с сайта ${new Date().toLocaleString('ru-RU')}</small></p>
    `;

    const text = `
Новое сообщение с сайта "Стекольный двор"

Имя: ${name}
Телефон: ${phone}
Email: ${email || 'Не указан'}

Сообщение:
${message}

---
Сообщение отправлено с сайта ${new Date().toLocaleString('ru-RU')}
    `;

    // Отправляем email
    const { sendEmail } = require('./config/email');
    const emailResult = await sendEmail(
        process.env.EMAIL_USER || 'your-email@yandex.ru',
        `📨 Новое сообщение от ${name}`,
        html,
        text
    );

    if (emailResult.success) {
        res.json({
            success: true,
            message: 'Сообщение отправлено! Мы свяжемся с вами.'
        });
    } else {
        console.error('❌ Ошибка отправки email:', emailResult.error);
        res.json({
            success: true,
            message: 'Сообщение принято! Мы свяжемся с вами.'
        });
    }
});

// Обработка 404
app.use((req, res) => {
    res.status(404).render('pages/error', {
        message: 'Страница не найдена',
        title: '404 - Страница не найдена'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).render('pages/error', {
        message: 'Внутренняя ошибка сервера: ' + err.message,
        title: '500 - Ошибка сервера'
    });
});

// ЗАПУСК
app.listen(PORT, () => {
    console.log(`\n✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`🔑 Админ: admin@stekolnyi-dvor.ru / admin123\n`);
});