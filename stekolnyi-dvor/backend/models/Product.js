const db = require('../config/database');

class Product {
    static getAll(page = 1, limit = 20, filters = {}) {
        return new Promise((resolve, reject) => {
            const offset = (page - 1) * limit;
            let query = `
                SELECT p.*, c.name as category_name, c.slug as category_slug
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.in_stock = 1
            `;
            const params = [];

            if (filters.category_id) {
                query += ' AND p.category_id = ?';
                params.push(filters.category_id);
            }
            if (filters.search) {
                query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm);
            }
            if (filters.is_new) {
                query += ' AND p.is_new = 1';
            }
            if (filters.is_popular) {
                query += ' AND p.is_popular = 1';
            }

            query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
    }

    static getAllAdmin(page = 1, limit = 100) {
        return new Promise((resolve, reject) => {
            const offset = (page - 1) * limit;
            db.all(
                `SELECT p.*, c.name as category_name
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 ORDER BY p.created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT p.*, c.name as category_name, c.slug as category_slug 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 WHERE p.id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
    }

    static getBySlug(slug) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT p.*, c.name as category_name, c.slug as category_slug 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 WHERE p.slug = ? AND p.in_stock = 1`,
                [slug],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
    }

    static getNew(limit = 6) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT p.*, c.name as category_name 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 WHERE p.is_new = 1 AND p.in_stock = 1
                 ORDER BY p.created_at DESC 
                 LIMIT ?`,
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    static getPopular(limit = 10) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT p.*, c.name as category_name 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 WHERE p.is_popular = 1 AND p.in_stock = 1
                 ORDER BY p.created_at DESC 
                 LIMIT ?`,
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    static create(data) {
        return new Promise((resolve, reject) => {
            const {
                name, slug, description, price, category_id,
                volume, in_stock, image_url, is_new, is_popular
            } = data;

            db.run(
                `INSERT INTO products 
                 (name, slug, description, price, category_id, volume, in_stock, 
                  image_url, is_new, is_popular) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, slug, description, price, category_id, volume, in_stock || 1,
                 image_url, is_new || 0, is_popular || 0],
                function(err) {
                    if (err) reject(err);
                    resolve({ id: this.lastID });
                }
            );
        });
    }

    static update(id, data) {
        return new Promise((resolve, reject) => {
            const {
                name, slug, description, price, category_id,
                volume, in_stock, image_url, is_new, is_popular
            } = data;

            db.run(
                `UPDATE products SET 
                 name = ?, slug = ?, description = ?, price = ?, 
                 category_id = ?, volume = ?, in_stock = ?, image_url = ?,
                 is_new = ?, is_popular = ?,
                 updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [name, slug, description, price, category_id, volume, in_stock || 1,
                 image_url, is_new || 0, is_popular || 0, id],
                function(err) {
                    if (err) reject(err);
                    resolve({ changes: this.changes });
                }
            );
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                resolve({ changes: this.changes });
            });
        });
    }

    static getImages(productId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT images FROM products WHERE id = ?', [productId], (err, row) => {
                if (err) reject(err);
                if (!row || !row.images) {
                    resolve([]);
                    return;
                }
                try {
                    const images = JSON.parse(row.images);
                    resolve(Array.isArray(images) ? images : []);
                } catch (e) {
                    resolve([]);
                }
            });
        });
    }

    static addImage(productId, imageUrl) {
        return new Promise((resolve, reject) => {
            this.getImages(productId).then(images => {
                images.push(imageUrl);
                const json = JSON.stringify(images);
                db.run(
                    'UPDATE products SET images = ? WHERE id = ?',
                    [json, productId],
                    function(err) {
                        if (err) reject(err);
                        resolve({ added: true });
                    }
                );
            }).catch(reject);
        });
    }

    static removeImage(productId, imageIndex) {
        return new Promise((resolve, reject) => {
            this.getImages(productId).then(images => {
                if (imageIndex < 0 || imageIndex >= images.length) {
                    resolve({ removed: false });
                    return;
                }
                images.splice(imageIndex, 1);
                const json = JSON.stringify(images);
                db.run(
                    'UPDATE products SET images = ? WHERE id = ?',
                    [json, productId],
                    function(err) {
                        if (err) reject(err);
                        resolve({ removed: true });
                    }
                );
            }).catch(reject);
        });
    }
}

module.exports = Product;