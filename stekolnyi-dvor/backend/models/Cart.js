const db = require('../config/database');

class Cart {
    // Получить корзину пользователя
    static getCart(sessionId, userId = null) {
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
                resolve(rows || []);
            });
        });
    }

    // Получить количество товаров в корзине
    static getCount(sessionId, userId = null) {
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

    // Добавить товар в корзину
    static addItem(sessionId, userId, productId, quantity = 1) {
        return new Promise((resolve, reject) => {
            // Проверяем, есть ли уже такой товар
            let checkQuery = 'SELECT * FROM cart_items WHERE product_id = ? AND ';
            let checkParams = [productId];
            
            if (userId) {
                checkQuery += 'user_id = ?';
                checkParams.push(userId);
            } else {
                checkQuery += 'session_id = ?';
                checkParams.push(sessionId);
            }

            db.get(checkQuery, checkParams, (err, existing) => {
                if (err) reject(err);

                if (existing) {
                    // Обновляем количество
                    const newQuantity = existing.quantity + quantity;
                    db.run(
                        'UPDATE cart_items SET quantity = ? WHERE id = ?',
                        [newQuantity, existing.id],
                        function(err) {
                            if (err) reject(err);
                            resolve({ id: existing.id, quantity: newQuantity });
                        }
                    );
                } else {
                    // Добавляем новый товар
                    const query = userId 
                        ? 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
                        : 'INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)';
                    const params = userId 
                        ? [userId, productId, quantity]
                        : [sessionId, productId, quantity];

                    db.run(query, params, function(err) {
                        if (err) reject(err);
                        resolve({ id: this.lastID, quantity });
                    });
                }
            });
        });
    }

    // Обновить количество товара в корзине
    static updateQuantity(itemId, quantity, sessionId, userId = null) {
        return new Promise((resolve, reject) => {
            // Проверяем, принадлежит ли товар пользователю
            let checkQuery = 'SELECT * FROM cart_items WHERE id = ? AND ';
            let checkParams = [itemId];
            
            if (userId) {
                checkQuery += 'user_id = ?';
                checkParams.push(userId);
            } else {
                checkQuery += 'session_id = ?';
                checkParams.push(sessionId);
            }

            db.get(checkQuery, checkParams, (err, item) => {
                if (err) reject(err);
                if (!item) {
                    reject(new Error('Товар не найден в корзине'));
                    return;
                }

                if (quantity <= 0) {
                    // Удаляем товар
                    db.run('DELETE FROM cart_items WHERE id = ?', [itemId], function(err) {
                        if (err) reject(err);
                        resolve({ deleted: true });
                    });
                } else {
                    // Обновляем количество
                    db.run(
                        'UPDATE cart_items SET quantity = ? WHERE id = ?',
                        [quantity, itemId],
                        function(err) {
                            if (err) reject(err);
                            resolve({ updated: true, quantity });
                        }
                    );
                }
            });
        });
    }

    // Удалить товар из корзины
    static removeItem(itemId, sessionId, userId = null) {
        return new Promise((resolve, reject) => {
            let query = 'DELETE FROM cart_items WHERE id = ? AND ';
            let params = [itemId];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.run(query, params, function(err) {
                if (err) reject(err);
                resolve({ deleted: true });
            });
        });
    }

    // Очистить корзину
    static clear(sessionId, userId = null) {
        return new Promise((resolve, reject) => {
            let query = 'DELETE FROM cart_items WHERE ';
            let params = [];
            
            if (userId) {
                query += 'user_id = ?';
                params.push(userId);
            } else {
                query += 'session_id = ?';
                params.push(sessionId);
            }

            db.run(query, params, function(err) {
                if (err) reject(err);
                resolve({ cleared: true });
            });
        });
    }

    // Перенести корзину из сессии в пользователя (при входе)
    static mergeCart(sessionId, userId) {
        return new Promise((resolve, reject) => {
            // Получаем товары из сессии
            db.all(
                'SELECT * FROM cart_items WHERE session_id = ?',
                [sessionId],
                (err, items) => {
                    if (err) reject(err);

                    if (items.length === 0) {
                        resolve({ merged: 0 });
                        return;
                    }

                    let merged = 0;
                    let processed = 0;

                    items.forEach(item => {
                        // Проверяем, есть ли такой товар у пользователя
                        db.get(
                            'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
                            [userId, item.product_id],
                            (err, existing) => {
                                if (err) {
                                    console.error('Merge error:', err);
                                    processed++;
                                    return;
                                }

                                if (existing) {
                                    // Обновляем количество
                                    db.run(
                                        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                                        [item.quantity, existing.id],
                                        (err) => {
                                            if (!err) merged++;
                                            processed++;
                                            if (processed === items.length) {
                                                // Удаляем сессионные товары
                                                db.run(
                                                    'DELETE FROM cart_items WHERE session_id = ?',
                                                    [sessionId],
                                                    () => {
                                                        resolve({ merged });
                                                    }
                                                );
                                            }
                                        }
                                    );
                                } else {
                                    // Переносим товар пользователю
                                    db.run(
                                        'UPDATE cart_items SET user_id = ?, session_id = NULL WHERE id = ?',
                                        [userId, item.id],
                                        (err) => {
                                            if (!err) merged++;
                                            processed++;
                                            if (processed === items.length) {
                                                resolve({ merged });
                                            }
                                        }
                                    );
                                }
                            }
                        );
                    });
                }
            );
        });
    }
}

module.exports = Cart;