const db = require('../config/database');
const bcrypt = require('bcrypt');

console.log('🔍 Проверка пользователей в базе данных...\n');

// Проверяем всех пользователей
db.all('SELECT * FROM users', [], (err, users) => {
    if (err) {
        console.error('❌ Ошибка:', err);
        return;
    }

    console.log(`👤 Всего пользователей: ${users.length}\n`);
    
    users.forEach((user, index) => {
        console.log(`--- Пользователь ${index + 1} ---`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Полное имя: ${user.full_name || 'Не указано'}`);
        console.log(`   Админ: ${user.is_admin ? 'Да' : 'Нет'}`);
        console.log(`   Хеш пароля: ${user.password_hash ? user.password_hash.substring(0, 30) + '...' : 'Нет'}`);
        
        // Проверяем, можно ли проверить пароль
        if (user.password_hash) {
            try {
                // Просто проверяем, что хеш валидный
                const isValid = bcrypt.compareSync('test', user.password_hash);
                console.log(`   Хеш пароля: ${isValid ? 'Валидный' : 'Возможно поврежден'}`);
            } catch (e) {
                console.log(`   Хеш пароля: ОШИБКА - ${e.message}`);
            }
        }
        console.log('');
    });
});