const db = require('../config/database');

console.log('🔄 Обновление структуры базы данных...');

// Добавляем поле in_stock в products (вместо stock)
db.run(`ALTER TABLE products ADD COLUMN in_stock INTEGER DEFAULT 1`, (err) => {
    if (err) {
        console.log('⚠️ Поле in_stock уже существует или ошибка:', err.message);
    } else {
        console.log('✅ Добавлено поле in_stock');
    }
});

// Создаем таблицу wishlist (желаемое)
db.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
`, (err) => {
    if (err) {
        console.error('❌ Ошибка создания таблицы wishlist:', err);
    } else {
        console.log('✅ Таблица wishlist создана');
    }
});

// Удаляем старые таблицы (если нужно)
// Корзина больше не нужна
db.run(`DROP TABLE IF EXISTS cart_items`, (err) => {
    if (err) {
        console.log('⚠️ Таблица cart_items не найдена');
    } else {
        console.log('✅ Таблица cart_items удалена');
    }
});

// Обновляем товары - добавляем in_stock для существующих
db.run(`UPDATE products SET in_stock = 1 WHERE in_stock IS NULL`, (err) => {
    if (err) {
        console.error('❌ Ошибка обновления in_stock:', err);
    } else {
        console.log('✅ Поле in_stock обновлено для всех товаров');
    }
});

console.log('✅ Структура БД обновлена!');