const db = require('../config/database');
const bcrypt = require('bcrypt');

const email = 'test@test.com';
const password = 'test123';
const username = 'testuser';

console.log('🔧 Создание тестового пользователя...');

// Проверяем, существует ли пользователь
db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
        console.error('❌ Ошибка:', err);
        return;
    }

    if (user) {
        console.log('⚠️ Пользователь уже существует:', user.email);
        console.log('   ID:', user.id);
        console.log('   Хеш пароля:', user.password_hash);
        return;
    }

    // Создаем пользователя
    const password_hash = bcrypt.hashSync(password, 10);
    console.log('🔐 Пароль захеширован');

    db.run(
        `INSERT INTO users (username, email, password_hash, full_name, is_admin) 
         VALUES (?, ?, ?, ?, 0)`,
        [username, email, password_hash, 'Test User'],
        function(err) {
            if (err) {
                console.error('❌ Ошибка создания:', err);
                return;
            }

            console.log('✅ Пользователь создан!');
            console.log(`   ID: ${this.lastID}`);
            console.log(`   Email: ${email}`);
            console.log(`   Пароль: ${password}`);
            console.log(`   Username: ${username}`);
            console.log('\n🔑 Попробуй войти с этими данными!');
        }
    );
});