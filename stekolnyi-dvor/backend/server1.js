const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const SQLiteStore = require('connect-sqlite3')(session);
const multer = require('multer');
/* const upload = require('./middleware/upload'); */
require('dotenv').config();

const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 START SERVER (упрощенная версия)');

// Подключение к базе данных
const db = require('./config/database');

// Импорт моделей
const Wishlist = require('./models/Wishlist');

// Импорт контроллера
const mainController = require('./controllers/mainController');


// Настройка хранения
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

// Затем используем:
app.post('/admin/products/add', upload.array('images', 10), mainController.adminProductAddPost);
app.post('/admin/products/edit/:id', upload.array('images', 10), mainController.adminProductEditPost);

// Настройка EJS с layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));
app.use(expressLayouts);
app.set('layout', 'layout');

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
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;
    next();
});

// Middleware для wishlistCount на всех страницах
app.use(async (req, res, next) => {
    try {
        const sessionId = req.session.id;
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
// АДМИНКА - ПРАВИЛЬНАЯ НАСТРОЙКА MULTER
// ============================================

// Для добавления товара - используем upload.array для нескольких файлов
app.get('/admin/products/add', mainController.adminProductAdd);
app.post('/admin/products/add', upload.array('images', 10), mainController.adminProductAddPost);

// Для редактирования товара
app.get('/admin/products/edit/:id', mainController.adminProductEdit);
app.post('/admin/products/edit/:id', upload.array('images', 10), mainController.adminProductEditPost);

// Удаление товара
app.post('/admin/products/delete/:id', mainController.adminProductDelete);

// Удаление изображения
app.post('/admin/products/remove-image/:id/:index', mainController.adminProductRemoveImage);

// Остальные маршруты админки
app.get('/admin', mainController.admin);
app.get('/admin/products', mainController.adminProducts);
app.get('/admin/categories', mainController.adminCategories);
app.post('/admin/categories/add', mainController.adminCategoryAdd);
app.post('/admin/categories/edit/:id', mainController.adminCategoryEdit);
app.post('/admin/categories/delete/:id', mainController.adminCategoryDelete);
app.get('/admin/orders', mainController.adminOrders);
app.get('/admin/orders/:id', mainController.adminOrderDetail);
app.post('/admin/orders/update-status/:id', mainController.adminOrderUpdateStatus);

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