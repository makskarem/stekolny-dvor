const Order = require('../models/Order');
const Product = require('../models/Product');
const db = require('../config/database');

// Показать страницу оформления заказа
exports.showCheckout = async (req, res) => {
    try {
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        // Получаем товары из корзины
        let query = `
            SELECT ci.*, p.name, p.price as product_price, p.image_url, p.stock
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE 
        `;
        
        let params = [];
        if (userId) {
            query += 'ci.user_id = ?';
            params.push(userId);
        } else {
            query += 'ci.session_id = ?';
            params.push(sessionId);
        }

        const items = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        if (items.length === 0) {
            return res.redirect('/cart');
        }

        let total = 0;
        items.forEach(item => {
            item.total_price = item.quantity * item.product_price;
            total += item.total_price;
        });

        // Получаем данные пользователя, если он авторизован
        let userData = null;
        if (userId) {
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });
            userData = user;
        }

        res.render('pages/checkout', {
            title: 'Оформление заказа',
            items,
            total,
            userData
        });
    } catch (error) {
        console.error('Show checkout error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки страницы оформления' });
    }
};

// Оформить заказ
exports.createOrder = async (req, res) => {
    try {
        const { 
            customer_name, phone, email, address, comment, contact_method 
        } = req.body;
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        // Получаем товары из корзины
        let query = `
            SELECT ci.*, p.name, p.price as product_price, p.stock
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE 
        `;
        
        let params = [];
        if (userId) {
            query += 'ci.user_id = ?';
            params.push(userId);
        } else {
            query += 'ci.session_id = ?';
            params.push(sessionId);
        }

        const items = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        if (items.length === 0) {
            return res.status(400).json({ success: false, message: 'Корзина пуста' });
        }

        // Проверяем наличие товаров на складе
        for (const item of items) {
            if (item.quantity > item.stock) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Недостаточно товара "${item.name}" на складе. Доступно: ${item.stock}` 
                });
            }
        }

        // Рассчитываем общую сумму
        let total = 0;
        const orderItems = items.map(item => {
            const price = item.product_price;
            total += item.quantity * price;
            return {
                product_id: item.product_id,
                quantity: item.quantity,
                price: price
            };
        });

        // Генерируем номер заказа
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

        // Создаем заказ
        const order = await Order.create({
            user_id: userId,
            order_number: orderNumber,
            total_amount: total,
            customer_name,
            phone,
            email,
            address,
            comment,
            contact_method,
            items: orderItems
        });

        // Обновляем остатки на складе
        for (const item of items) {
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.product_id],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        }

        // Очищаем корзину
        let deleteQuery = 'DELETE FROM cart_items WHERE ';
        let deleteParams = [];
        if (userId) {
            deleteQuery += 'user_id = ?';
            deleteParams.push(userId);
        } else {
            deleteQuery += 'session_id = ?';
            deleteParams.push(sessionId);
        }

        await new Promise((resolve, reject) => {
            db.run(deleteQuery, deleteParams, (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ 
            success: true, 
            message: 'Заказ успешно оформлен',
            orderNumber: orderNumber,
            orderId: order.id
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: 'Ошибка оформления заказа' });
    }
};

// Страница успешного заказа
exports.orderSuccess = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.getById(id);
        
        if (!order) {
            return res.status(404).render('error', { message: 'Заказ не найден' });
        }

        const items = await Order.getItems(id);

        res.render('pages/order-success', {
            title: 'Заказ оформлен',
            order,
            items
        });
    } catch (error) {
        console.error('Order success error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки страницы заказа' });
    }
};