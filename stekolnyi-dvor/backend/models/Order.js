const db = require('../config/database');

class Order {
    static create(data) {
        return new Promise((resolve, reject) => {
            const {
                user_id, order_number, total_amount, customer_name,
                phone, email, address, comment, contact_method, items
            } = data;

            db.run(
                `INSERT INTO orders 
                 (user_id, order_number, total_amount, customer_name, 
                  phone, email, address, comment, contact_method) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id || null, order_number, total_amount, customer_name,
                 phone, email, address, comment, contact_method],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const orderId = this.lastID;

                    // Добавляем товары в заказ
                    const stmt = db.prepare(
                        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
                    );
                    items.forEach(item => {
                        stmt.run([orderId, item.product_id, item.quantity, item.price]);
                    });
                    stmt.finalize();

                    resolve({ id: orderId });
                }
            );
        });
    }

    static getAll(limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT o.*, u.username 
                 FROM orders o
                 LEFT JOIN users u ON o.user_id = u.id
                 ORDER BY o.created_at DESC 
                 LIMIT ? OFFSET ?`,
                [limit, offset],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT o.*, u.username 
                 FROM orders o
                 LEFT JOIN users u ON o.user_id = u.id
                 WHERE o.id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
    }

    static getItems(orderId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT oi.*, p.name, p.image_url 
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?`,
                [orderId],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    }

    static updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, id],
                function(err) {
                    if (err) reject(err);
                    resolve({ changes: this.changes });
                }
            );
        });
    }

    static getByUser(userId) {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    }
}

module.exports = Order;