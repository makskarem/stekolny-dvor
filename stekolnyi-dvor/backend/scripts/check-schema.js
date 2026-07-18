const db = require('../config/database');

console.log('🔍 Проверка структуры базы данных...\n');

// Проверяем таблицы
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
        console.error('❌ Ошибка:', err);
        return;
    }
    
    console.log('📋 Таблицы в базе:');
    tables.forEach(table => {
        console.log(`   - ${table.name}`);
    });
    console.log('');
    
    // Проверяем структуру users
    db.all("PRAGMA table_info(users)", [], (err, columns) => {
        console.log('📋 Структура таблицы users:');
        columns.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
        });
        console.log('');
        
        // Проверяем пользователей
        db.all('SELECT * FROM users', [], (err, users) => {
            console.log(`👤 Пользователи (${users.length}):`);
            users.forEach(user => {
                console.log(`   ID: ${user.id}, Email: ${user.email}, Username: ${user.username}, Админ: ${user.is_admin}`);
            });
            console.log('');
            
            // Проверяем заказы
            db.all('SELECT * FROM orders', [], (err, orders) => {
                console.log(`📦 Заказы (${orders.length}):`);
                orders.forEach(order => {
                    console.log(`   ID: ${order.id}, Номер: ${order.order_number}, Клиент: ${order.customer_name}, Сумма: ${order.total_amount}`);
                });
                console.log('');
                
                // Проверяем товары в заказах
                db.all('SELECT * FROM order_items', [], (err, items) => {
                    console.log(`📦 Товары в заказах (${items.length}):`);
                    items.forEach(item => {
                        console.log(`   Заказ: ${item.order_id}, Товар: ${item.product_id}, Количество: ${item.quantity}`);
                    });
                    console.log('');
                });
            });
        });
    });
});