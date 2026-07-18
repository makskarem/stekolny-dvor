const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Таблица пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            phone TEXT,
            address TEXT,
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Таблица категорий
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            sort_order INTEGER DEFAULT 0
        )
    `);

    // Таблица товаров
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            category_id INTEGER,
            volume TEXT,
            stock INTEGER DEFAULT 0,
            image_url TEXT,
            is_new INTEGER DEFAULT 0,
            is_popular INTEGER DEFAULT 0,
            is_exclusive INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    `);

    // Таблица заказов
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            order_number TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'new',
            total_amount DECIMAL(10, 2) NOT NULL,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            address TEXT,
            comment TEXT,
            contact_method TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Таблица товаров в заказе
    db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    // Таблица корзины
    db.run(`
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            user_id INTEGER,
            product_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    // Добавляем категории
    const categories = [
        'Бутылки для крепких напитков',
        'Наборы бутылок',
        'Штофы и графины',
        'Декорированные бутылки',
        'Бутыли и банки для виноделия',
        'Винные бутылки',
        'Винные графины',
        'Емкости стеклянные с краном',
        'Банки твист офф',
        'Стеклобанка СКО',
        'Стеклянная банка для мёда',
        'Стеклянные банки для икры',
        'Бутылки для масла, уксуса, соков',
        'Стаканы',
        'Банки стеклянные с бугельным замком',
        'Лимонадники',
        'Пробки, колпачки и прочее'
    ];

    categories.forEach((name, index) => {
        const slug = name.toLowerCase().replace(/[^а-яa-z0-9]+/g, '-');
        db.run(
            `INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, ?)`,
            [name, slug, index]
        );
    });

    // Добавляем администратора
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(
        `INSERT OR IGNORE INTO users (username, email, password_hash, full_name, is_admin) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin', 'admin@stekolnyi-dvor.ru', adminPassword, 'Администратор', 1]
    );

    console.log('✅ База данных успешно инициализирована!');
    console.log('📧 Администратор: admin@stekolnyi-dvor.ru');
    console.log('🔑 Пароль: admin123');
});

db.close();