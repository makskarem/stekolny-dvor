const nodemailer = require('nodemailer');

// Настройка для Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // ← это пароль приложения
    }
});

// Проверка подключения
transporter.verify(function(error, success) {
    if (error) {
        console.log('❌ Ошибка подключения к почте:', error);
    } else {
        console.log('✅ Почта настроена правильно');
    }
});

// Функция отправки письма
async function sendEmail(to, subject, html, text = '') {
    try {
        // Проверяем, что email настроен
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Email не настроен в .env');
            return { success: false, error: 'Email не настроен' };
        }

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text || html.replace(/<[^>]*>/g, ''),
            html: html
        });
        console.log('✅ Email отправлен:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Ошибка отправки email:', error);
        return { success: false, error: error.message };
    }
}

// Функция для форматирования списка товаров
function formatProductsList(products) {
    if (!products || products.length === 0) return 'Не указаны';
    
    try {
        const items = typeof products === 'string' ? JSON.parse(products) : products;
        if (!Array.isArray(items) || items.length === 0) return 'Не указаны';
        return items.map(p => `• ${p.name} - ${p.price || 'цена не указана'} ₽`).join('\n');
    } catch (e) {
        return String(products);
    }
}

module.exports = { sendEmail, formatProductsList };