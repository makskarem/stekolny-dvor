const db = require('../config/database');

console.log('🔄 Добавление поля images в таблицу products...');

// Добавляем поле images (хранит JSON массив)
db.run(`ALTER TABLE products ADD COLUMN images TEXT`, (err) => {
    if (err) {
        console.log('⚠️ Поле images уже существует или ошибка:', err.message);
    } else {
        console.log('✅ Добавлено поле images');
    }
});

// Переносим старые изображения в новое поле
db.run(`UPDATE products SET images = json_array(image_url) WHERE image_url IS NOT NULL AND images IS NULL`, (err) => {
    if (err) {
        console.error('❌ Ошибка переноса:', err);
    } else {
        console.log('✅ Старые изображения перенесены');
    }
});

console.log('✅ Готово!');