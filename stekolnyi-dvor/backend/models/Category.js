const db = require('../config/database');

class Category {
    static getAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM categories ORDER BY sort_order', (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM categories WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static getBySlug(slug) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM categories WHERE slug = ?', [slug], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static create(data) {
        return new Promise((resolve, reject) => {
            const { name, slug, description, sort_order } = data;
            db.run(
                'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)',
                [name, slug, description, sort_order || 0],
                function(err) {
                    if (err) reject(err);
                    resolve({ id: this.lastID });
                }
            );
        });
    }

    static update(id, data) {
        return new Promise((resolve, reject) => {
            const { name, slug, description, sort_order } = data;
            db.run(
                'UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ? WHERE id = ?',
                [name, slug, description, sort_order || 0, id],
                function(err) {
                    if (err) reject(err);
                    resolve({ changes: this.changes });
                }
            );
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                resolve({ changes: this.changes });
            });
        });
    }
}

module.exports = Category;