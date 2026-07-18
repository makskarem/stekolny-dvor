const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT id, username, email, full_name, phone, address, is_admin, created_at FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static create(data) {
        return new Promise((resolve, reject) => {
            const { username, email, password, full_name, phone, address } = data;
            const password_hash = bcrypt.hashSync(password, 10);

            db.run(
                `INSERT INTO users (username, email, password_hash, full_name, phone, address) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [username, email, password_hash, full_name || '', phone || '', address || ''],
                function(err) {
                    if (err) reject(err);
                    resolve({ id: this.lastID });
                }
            );
        });
    }

    static update(id, data) {
        return new Promise((resolve, reject) => {
            const { full_name, phone, address } = data;
            db.run(
                'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
                [full_name, phone, address, id],
                function(err) {
                    if (err) reject(err);
                    resolve({ changes: this.changes });
                }
            );
        });
    }

    static verifyPassword(user, password) {
        return bcrypt.compareSync(password, user.password_hash);
    }
}

module.exports = User;