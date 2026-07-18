const db = require('../config/database');

class Wishlist {
    // Получить список желаемого
    static getItems(sessionId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT w.*, p.name, p.price, p.image_url, p.slug, p.description
                 FROM wishlist w
                 JOIN products p ON w.product_id = p.id
                 WHERE w.session_id = ? AND p.in_stock = 1
                 ORDER BY w.created_at DESC`,
                [sessionId],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    // Добавить в желаемое
    static addItem(sessionId, productId) {
        return new Promise((resolve, reject) => {
            // Проверяем, есть ли уже
            db.get(
                'SELECT * FROM wishlist WHERE session_id = ? AND product_id = ?',
                [sessionId, productId],
                (err, existing) => {
                    if (err) reject(err);
                    if (existing) {
                        resolve({ id: existing.id, exists: true });
                        return;
                    }

                    db.run(
                        'INSERT INTO wishlist (session_id, product_id) VALUES (?, ?)',
                        [sessionId, productId],
                        function(err) {
                            if (err) reject(err);
                            resolve({ id: this.lastID, exists: false });
                        }
                    );
                }
            );
        });
    }

    // Удалить из желаемого
    static removeItem(sessionId, productId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM wishlist WHERE session_id = ? AND product_id = ?',
                [sessionId, productId],
                function(err) {
                    if (err) reject(err);
                    resolve({ deleted: true });
                }
            );
        });
    }

    // Удалить все
    static clear(sessionId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM wishlist WHERE session_id = ?',
                [sessionId],
                function(err) {
                    if (err) reject(err);
                    resolve({ cleared: true });
                }
            );
        });
    }

    // Получить количество
    static getCount(sessionId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT COUNT(*) as total FROM wishlist WHERE session_id = ?',
                [sessionId],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row ? row.total : 0);
                }
            );
        });
    }
}

module.exports = Wishlist;