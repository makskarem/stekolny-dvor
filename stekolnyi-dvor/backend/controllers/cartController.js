const db = require('../config/database');
const Product = require('../models/Product');

// Получить корзину
exports.getCart = async (req, res) => {
    try {
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

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

        let total = 0;
        items.forEach(item => {
            item.total_price = item.quantity * item.product_price;
            total += item.total_price;
        });

        res.render('pages/cart', {
            title: 'Корзина',
            items,
            total
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки корзины' });
    }
};

// Добавить в корзину
exports.addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        // Проверяем наличие товара
        const product = await Product.getById(product_id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Товар не найден' });
        }

        // Проверяем наличие на складе
        if (product.stock < quantity) {
            return res.status(400).json({ success: false, message: 'Недостаточно товара на складе' });
        }

        // Проверяем, есть ли уже товар в корзине
        const existingItem = await new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cart_items WHERE product_id = ? AND ';
            let params = [product_id];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.get(query, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (existingItem) {
            // Обновляем количество
            const newQuantity = existingItem.quantity + parseInt(quantity);
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE cart_items SET quantity = ? WHERE id = ?',
                    [newQuantity, existingItem.id],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        } else {
            // Добавляем новый элемент в корзину
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO cart_items (product_id, quantity, session_id, user_id) VALUES (?, ?, ?, ?)',
                    [product_id, quantity, sessionId, userId],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        }

        res.json({ success: true, message: 'Товар добавлен в корзину' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Ошибка добавления товара в корзину' });
    }
};

const db = require('../config/database');
const Product = require('../models/Product');
// Получить корзину
exports.getCart = async (req, res) => {
    try {
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

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

        let total = 0;
        items.forEach(item => {
            item.total_price = item.quantity * item.product_price;
            total += item.total_price;
        });

        // Получаем количество товаров в корзине для отображения в шапке
        const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

        res.render('pages/cart', {
            title: 'Корзина',
            items,
            total,
            cartCount
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки корзины' });
    }
};

// Добавить в корзину
exports.addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        // Проверяем наличие товара
        const product = await Product.getById(product_id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Товар не найден' });
        }

        // Проверяем наличие на складе
        if (product.stock < quantity) {
            return res.status(400).json({ success: false, message: 'Недостаточно товара на складе' });
        }

        // Проверяем, есть ли уже товар в корзине
        const existingItem = await new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cart_items WHERE product_id = ? AND ';
            let params = [product_id];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.get(query, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (existingItem) {
            // Обновляем количество
            const newQuantity = existingItem.quantity + parseInt(quantity);
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE cart_items SET quantity = ? WHERE id = ?',
                    [newQuantity, existingItem.id],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        } else {
            // Добавляем новый товар
            await new Promise((resolve, reject) => {
                const query = userId 
                    ? 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
                    : 'INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)';
                const params = userId 
                    ? [userId, product_id, quantity]
                    : [sessionId, product_id, quantity];
                
                db.run(query, params, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        }

        // Получаем общее количество товаров в корзине
        const cartCount = await getCartCount(sessionId, userId);

        res.json({ 
            success: true, 
            message: 'Товар добавлен в корзину',
            cartCount 
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Ошибка добавления в корзину' });
    }
};

// Обновить количество в корзине
exports.updateCart = async (req, res) => {
    try {
        const { item_id, quantity } = req.body;
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Количество должно быть больше 0' });
        }

        // Проверяем, принадлежит ли товар корзине пользователя
        const item = await new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cart_items WHERE id = ? AND ';
            let params = [item_id];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.get(query, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Товар не найден в корзине' });
        }

        // Обновляем количество
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [quantity, item_id],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        // Получаем обновленную информацию о корзине
        const cartItems = await getCartItems(sessionId, userId);
        const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.product_price), 0);
        const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({ 
            success: true, 
            cartItems,
            total,
            cartCount
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: 'Ошибка обновления корзины' });
    }
};

// Удалить из корзины
exports.removeFromCart = async (req, res) => {
    try {
        const { item_id } = req.params;
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        // Проверяем, принадлежит ли товар корзине пользователя
        const item = await new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cart_items WHERE id = ? AND ';
            let params = [item_id];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.get(query, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Товар не найден в корзине' });
        }

        // Удаляем товар
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM cart_items WHERE id = ?', [item_id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        // Получаем обновленную информацию о корзине
        const cartItems = await getCartItems(sessionId, userId);
        const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.product_price), 0);
        const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({ 
            success: true, 
            cartItems,
            total,
            cartCount
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, message: 'Ошибка удаления из корзины' });
    }
};

// Вспомогательные функции
async function getCartItems(sessionId, userId) {
    return new Promise((resolve, reject) => {
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

        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

async function getCartCount(sessionId, userId) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT SUM(quantity) as total FROM cart_items WHERE ';
        let params = [];
        
        if (userId) {
            query += 'user_id = ?';
            params.push(userId);
        } else {
            query += 'session_id = ?';
            params.push(sessionId);
        }

        db.get(query, params, (err, row) => {
            if (err) reject(err);
            resolve(row ? row.total || 0 : 0);
        });
    });
}

const db = require('../config/database');
const Product = require('../models/Product');

// Получить корзину
exports.getCart = async (req, res) => {
    try {
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

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

        let total = 0;
        items.forEach(item => {
            item.total_price = item.quantity * item.product_price;
            total += item.total_price;
        });

        const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

        res.render('pages/cart', {
            title: 'Корзина',
            items,
            total,
            cartCount
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки корзины' });
    }
};

// Добавить в корзину
exports.addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        const product = await Product.getById(product_id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Товар не найден' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ success: false, message: 'Недостаточно товара на складе' });
        }

        // Проверяем, есть ли уже товар в корзине
        const existingItem = await new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cart_items WHERE product_id = ? AND ';
            let params = [product_id];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.get(query, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (existingItem) {
            const newQuantity = existingItem.quantity + parseInt(quantity);
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE cart_items SET quantity = ? WHERE id = ?',
                    [newQuantity, existingItem.id],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        } else {
            await new Promise((resolve, reject) => {
                const query = userId 
                    ? 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
                    : 'INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)';
                const params = userId 
                    ? [userId, product_id, quantity]
                    : [sessionId, product_id, quantity];
                
                db.run(query, params, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        }

        const cartCount = await getCartCount(sessionId, userId);

        res.json({ 
            success: true, 
            message: 'Товар добавлен в корзину',
            cartCount 
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Ошибка добавления в корзину' });
    }
};

// Обновить количество в корзине
exports.updateCart = async (req, res) => {
    try {
        const { item_id, quantity } = req.body;
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Количество должно быть больше 0' });
        }

        const item = await new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cart_items WHERE id = ? AND ';
            let params = [item_id];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.get(query, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Товар не найден в корзине' });
        }

        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [quantity, item_id],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        const cartItems = await getCartItems(sessionId, userId);
        const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.product_price), 0);
        const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({ 
            success: true, 
            cartItems,
            total,
            cartCount
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: 'Ошибка обновления корзины' });
    }
};

// Удалить из корзины
exports.removeFromCart = async (req, res) => {
    try {
        const { item_id } = req.params;
        const sessionId = req.session.id;
        const userId = req.session.user ? req.session.user.id : null;

        const item = await new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cart_items WHERE id = ? AND ';
            let params = [item_id];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.get(query, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Товар не найден в корзине' });
        }

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM cart_items WHERE id = ?', [item_id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        const cartItems = await getCartItems(sessionId, userId);
        const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.product_price), 0);
        const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({ 
            success: true, 
            cartItems,
            total,
            cartCount
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, message: 'Ошибка удаления из корзины' });
    }
};

// Вспомогательные функции
async function getCartItems(sessionId, userId) {
    return new Promise((resolve, reject) => {
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

        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

async function getCartCount(sessionId, userId) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT SUM(quantity) as total FROM cart_items WHERE ';
        let params = [];
        
        if (userId) {
            query += 'user_id = ?';
            params.push(userId);
        } else {
            query += 'session_id = ?';
            params.push(sessionId);
        }

        db.get(query, params, (err, row) => {
            if (err) reject(err);
            resolve(row ? row.total || 0 : 0);
        });
    });
}