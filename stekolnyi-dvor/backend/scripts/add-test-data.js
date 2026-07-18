const db = require('../config/database');
const bcrypt = require('bcrypt');

console.log('📦 Добавление тестовых данных...');

// Тестовые товары
const products = [
    {
        name: 'Бутылка для вина 0.75л',
        slug: 'butylka-dlya-vina-075l',
        description: 'Классическая винная бутылка из прозрачного стекла объемом 0.75 литра',
        price: 45.00,
        category_id: 6,
        volume: '0.75 л',
        stock: 100,
        is_new: 1,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Банка твист-офф 1л',
        slug: 'banka-twist-off-1l',
        description: 'Стеклянная банка с крышкой твист-офф объемом 1 литр',
        price: 65.00,
        category_id: 9,
        volume: '1 л',
        stock: 150,
        is_new: 1,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Графин стеклянный 0.5л',
        slug: 'grafin-steklyannyj-05l',
        description: 'Элегантный стеклянный графин для напитков объемом 0.5 литра',
        price: 120.00,
        category_id: 3,
        volume: '0.5 л',
        stock: 50,
        is_exclusive: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Банка для меда 0.5л',
        slug: 'banka-dlya-meda-05l',
        description: 'Стеклянная банка для меда с удобной крышкой',
        price: 55.00,
        category_id: 11,
        volume: '0.5 л',
        stock: 200,
        is_new: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Бутылка для масла 0.5л',
        slug: 'butylka-dlya-masla-05l',
        description: 'Стеклянная бутылка для растительного масла',
        price: 75.00,
        category_id: 13,
        volume: '0.5 л',
        stock: 80,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Штоф стеклянный 0.7л',
        slug: 'shtof-steklyannyj-07l',
        description: 'Красивый штоф из стекла объемом 0.7 литра',
        price: 150.00,
        category_id: 3,
        volume: '0.7 л',
        stock: 30,
        is_exclusive: 1,
        image_url: '/images/placeholder.jpg'
    }
];

// Добавляем товары
products.forEach((product, index) => {
    const sql = `
        INSERT OR IGNORE INTO products 
        (name, slug, description, price, category_id, volume, stock, 
         is_new, is_popular, is_exclusive, image_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
        product.name,
        product.slug,
        product.description,
        product.price,
        product.category_id,
        product.volume,
        product.stock,
        product.is_new || 0,
        product.is_popular || 0,
        product.is_exclusive || 0,
        product.image_url
    ], function(err) {
        if (err) {
            console.error(`❌ Ошибка добавления "${product.name}":`, err.message);
        } else {
            console.log(`✅ Добавлен товар: ${product.name}`);
        }
    });
});

// Проверяем, что добавилось
setTimeout(() => {
    db.all('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (!err) {
            console.log(`\n📊 Всего товаров в базе: ${row[0].count}`);
        }
    });
}, 1000);

console.log('\n✅ Скрипт завершен!');