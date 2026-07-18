const db = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Wishlist = require('../models/Wishlist');

const fs = require('fs');
const path = require('path');

const { sendEmail, formatProductsList } = require('../config/email');

console.log('🔄 Загрузка mainController (упрощенная версия)...');

// ============================================
// ХЕЛПЕР ДЛЯ ПОЛУЧЕНИЯ ПЕРВОГО ИЗОБРАЖЕНИЯ
// ============================================
function getFirstImageFromProduct(product) {
    if (!product) return '/images/placeholder.jpg';
    
    if (product.images) {
        try {
            const images = JSON.parse(product.images);
            if (Array.isArray(images) && images.length > 0) {
                return images[0];
            }
        } catch(e) {}
    }
    
    if (product.image_url) {
        return product.image_url;
    }
    
    return '/images/placeholder.jpg';
}

// ============================================
// КОНТРОЛЛЕР
// ============================================
const mainController = {

    // ============================================
    // ГЛАВНАЯ СТРАНИЦА
    // ============================================
    index: function(req, res) {
        const sessionId = req.session.id;
        
        db.all('SELECT * FROM products WHERE in_stock = 1 AND is_new = 1', [], function(err, newProducts) {
            db.all('SELECT * FROM products WHERE in_stock = 1 AND is_popular = 1 LIMIT 10', [], function(err, popularProducts) {
                db.all('SELECT * FROM categories', [], function(err, categories) {
                    const newProductsWithImage = (newProducts || []).map(function(p) {
                        return {
                            ...p,
                            firstImage: getFirstImageFromProduct(p)
                        };
                    });
                    
                    const popularWithImage = (popularProducts || []).map(function(p) {
                        return {
                            ...p,
                            firstImage: getFirstImageFromProduct(p)
                        };
                    });
                    
                    Wishlist.getCount(sessionId).then(function(wishlistCount) {
                        res.render('pages/index', {
                            title: 'Стекольный двор - Стеклобанки и стеклобутылки',
                            popularProducts: popularWithImage,
                            newProducts: newProductsWithImage,
                            categories: categories || [],
                            wishlistCount: wishlistCount || 0,
                            user: req.session.user || null
                        });
                    });
                });
            });
        });
    },

    // ============================================
    // КАТАЛОГ
    // ============================================
    catalog: function(req, res) {
        const sessionId = req.session.id;
        const categorySlug = req.query.category;
        const search = req.query.search || '';

        let isNewFilter = false;
        if (categorySlug === 'novinki') {
            isNewFilter = true;
        }

        let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.in_stock = 1';
        let params = [];

        if (isNewFilter) {
            query += ' AND p.is_new = 1';
        } else if (categorySlug) {
            query += ' AND c.slug = ?';
            params.push(categorySlug);
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push('%' + search + '%', '%' + search + '%');
        }

        db.all(query, params, function(err, products) {
            db.all('SELECT * FROM categories', [], function(err, categories) {
                var categoriesWithNew = [
                    { id: 0, name: 'Все товары', slug: '' },
                    { id: -1, name: '🆕 Новинки', slug: 'novinki' }
                ];
                
                for (var i = 0; i < categories.length; i++) {
                    categoriesWithNew.push(categories[i]);
                }

                var currentCategory = null;
                if (categorySlug === 'novinki') {
                    currentCategory = { id: -1, name: 'Новинки', slug: 'novinki' };
                } else if (categorySlug) {
                    for (var j = 0; j < categories.length; j++) {
                        if (categories[j].slug === categorySlug) {
                            currentCategory = categories[j];
                            break;
                        }
                    }
                }

                Wishlist.getCount(sessionId).then(function(wishlistCount) {
                    var title = 'Каталог товаров';
                    if (isNewFilter) {
                        title = 'Новинки';
                    } else if (currentCategory) {
                        title = currentCategory.name;
                    }

                    res.render('pages/catalog', {
                        title: title,
                        products: products || [],
                        categories: categoriesWithNew,
                        currentCategory: currentCategory,
                        search: search,
                        wishlistCount: wishlistCount || 0,
                        user: req.session.user || null,
                        pagination: {
                            currentPage: 1,
                            totalPages: 1,
                            total: products ? products.length : 0
                        }
                    });
                });
            });
        });
    },

    // ============================================
    // СТРАНИЦА ТОВАРА
    // ============================================
    productDetail: function(req, res) {
        var slug = req.params.slug;
        var sessionId = req.session.id;

        db.get(
            'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.in_stock = 1',
            [slug],
            function(err, product) {
                if (err || !product) {
                    return res.status(404).render('pages/error', {
                        message: 'Товар не найден',
                        title: '404 - Товар не найден'
                    });
                }

                db.all('SELECT * FROM categories ORDER BY sort_order', [], function(err, categories) {
                    Wishlist.getCount(sessionId).then(function(wishlistCount) {
                        res.render('pages/product', {
                            title: product.name,
                            product: product,
                            categories: categories || [],
                            wishlistCount: wishlistCount || 0,
                            user: req.session.user || null
                        });
                    });
                });
            }
        );
    },

    // ============================================
    // СТРАНИЦЫ
    // ============================================
    about: function(req, res) {
        res.render('pages/about', {
            title: 'О нас',
            user: req.session.user || null
        });
    },

    contacts: function(req, res) {
        res.render('pages/contacts', {
            title: 'Контакты',
            user: req.session.user || null
        });
    },

    // ============================================
    // ЖЕЛАЕМОЕ
    // ============================================
    wishlist: function(req, res) {
        var ids = req.query.ids ? req.query.ids.split(',').map(Number) : [];

        console.log('📋 Запрос желаемого, IDs:', ids);

        if (ids.length === 0) {
            return res.render('pages/wishlist', {
                title: 'Желаемое',
                items: [],
                count: 0,
                user: req.session.user || null
            });
        }

        var placeholders = '';
        for (var i = 0; i < ids.length; i++) {
            if (i > 0) placeholders += ',';
            placeholders += '?';
        }
        
        var query = 'SELECT * FROM products WHERE id IN (' + placeholders + ') AND in_stock = 1';

        db.all(query, ids, function(err, products) {
            if (err) {
                console.error('❌ Ошибка получения желаемого:', err);
                return res.render('pages/wishlist', {
                    title: 'Желаемое',
                    items: [],
                    count: 0,
                    user: req.session.user || null
                });
            }

            var items = [];
            for (var k = 0; k < ids.length; k++) {
                for (var m = 0; m < products.length; m++) {
                    if (products[m].id === ids[k]) {
                        items.push(products[m]);
                        break;
                    }
                }
            }

            res.render('pages/wishlist', {
                title: 'Желаемое',
                items: items || [],
                count: items.length,
                user: req.session.user || null
            });
        });
    },

    // ============================================
    // API - ЖЕЛАЕМОЕ
    // ============================================
    addToWishlist: function(req, res) {
        var product_id = req.body.product_id;
        var sessionId = req.session.id;

        Wishlist.addItem(sessionId, product_id).then(function(result) {
            return Wishlist.getCount(sessionId).then(function(count) {
                res.json({
                    success: true,
                    exists: result.exists,
                    count: count,
                    message: result.exists ? 'Уже в желаемом' : 'Добавлено в желаемое'
                });
            });
        }).catch(function(error) {
            console.error('Add to wishlist error:', error);
            res.status(500).json({ success: false, message: 'Ошибка добавления' });
        });
    },

    removeFromWishlist: function(req, res) {
        var product_id = req.params.product_id;
        var sessionId = req.session.id;

        Wishlist.removeItem(sessionId, parseInt(product_id)).then(function() {
            return Wishlist.getCount(sessionId).then(function(count) {
                res.json({
                    success: true,
                    count: count,
                    message: 'Удалено из желаемого'
                });
            });
        }).catch(function(error) {
            console.error('Remove from wishlist error:', error);
            res.status(500).json({ success: false, message: 'Ошибка удаления' });
        });
    },

    wishlistCount: function(req, res) {
        var sessionId = req.session.id;

        Wishlist.getCount(sessionId).then(function(count) {
            res.json({ count: count || 0 });
        }).catch(function(error) {
            console.error('Wishlist count error:', error);
            res.json({ count: 0 });
        });
    },

    // ============================================
    // ФОРМА ЗАКАЗА ЗВОНКА
    // ============================================
    callRequest: function(req, res) {
        var name = req.body.name;
        var phone = req.body.phone;
        var email = req.body.email;
        var message = req.body.message;
        var products = req.body.products;

        console.log('📞 Новая заявка на звонок!');
        console.log('   Имя:', name);
        console.log('   Телефон:', phone);
        console.log('   Email:', email || 'Не указан');
        console.log('   Сообщение:', message || 'Не указано');
        console.log('   Товары:', products);

        var productsList = 'Не указаны';
        var productsHtml = '<p>Не указаны</p>';

        if (products) {
            try {
                var items = typeof products === 'string' ? JSON.parse(products) : products;
                if (Array.isArray(items) && items.length > 0) {
                    productsList = '';
                    productsHtml = '<ul>';
                    for (var i = 0; i < items.length; i++) {
                        var priceText = items[i].price || 'цена не указана';
                        productsList += '• ' + items[i].name + ' - ' + priceText + ' ₽\n';
                        productsHtml += '<li>' + items[i].name + ' - <strong>' + priceText + ' ₽</strong></li>';
                    }
                    productsHtml += '</ul>';
                }
            } catch (e) {
                productsList = String(products);
                productsHtml = '<p>' + String(products) + '</p>';
            }
        }

        var currentDate = new Date().toLocaleString('ru-RU');
        
        var html = '<h2>📞 Новая заявка с сайта "Стекольный двор"</h2>' +
            '<p><strong>Имя:</strong> ' + name + '</p>' +
            '<p><strong>Телефон:</strong> ' + phone + '</p>' +
            '<p><strong>Email:</strong> ' + (email || 'Не указан') + '</p>' +
            '<p><strong>Сообщение:</strong> ' + (message || 'Не указано') + '</p>' +
            '<h3>Интересующие товары:</h3>' + productsHtml +
            '<hr><p><small>Заявка отправлена с сайта ' + currentDate + '</small></p>';

        var text = 'Новая заявка с сайта "Стекольный двор"\n\n' +
            'Имя: ' + name + '\n' +
            'Телефон: ' + phone + '\n' +
            'Email: ' + (email || 'Не указан') + '\n' +
            'Сообщение: ' + (message || 'Не указано') + '\n\n' +
            'Интересующие товары:\n' + productsList + '\n\n' +
            '---\nЗаявка отправлена с сайта ' + currentDate;

        var emailUser = process.env.EMAIL_USER || 'your-email@yandex.ru';
        
        sendEmail(emailUser, '📞 Новая заявка от ' + name, html, text).then(function(emailResult) {
            if (emailResult.success) {
                res.json({
                    success: true,
                    message: 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.'
                });
            } else {
                console.error('❌ Ошибка отправки email:', emailResult.error);
                res.json({
                    success: true,
                    message: 'Заявка принята! Мы свяжемся с вами в ближайшее время.'
                });
            }
        }).catch(function(error) {
            console.error('❌ Ошибка отправки email:', error);
            res.json({
                success: true,
                message: 'Заявка принята! Мы свяжемся с вами в ближайшее время.'
            });
        });
    },

    // ============================================
    // АДМИНКА - ДАШБОРД
    // ============================================
    admin: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        db.get('SELECT COUNT(*) as count FROM products WHERE in_stock = 1', [], function(err, inStock) {
            db.get('SELECT COUNT(*) as count FROM products WHERE in_stock = 0', [], function(err, outStock) {
                db.get('SELECT COUNT(*) as count FROM categories', [], function(err, categoryCount) {
                    db.get('SELECT COUNT(*) as count FROM wishlist', [], function(err, wishlistCount) {
                        db.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5', [], function(err, recentOrders) {
                            var totalProducts = (inStock ? inStock.count : 0) + (outStock ? outStock.count : 0);
                            
                            res.render('pages/admin/dashboard', {
                                title: 'Админ-панель',
                                stats: {
                                    total_products: totalProducts,
                                    in_stock: inStock ? inStock.count : 0,
                                    out_stock: outStock ? outStock.count : 0,
                                    total_categories: categoryCount ? categoryCount.count : 0,
                                    wishlist_count: wishlistCount ? wishlistCount.count : 0
                                },
                                recentOrders: recentOrders || [],
                                user: req.session.user
                            });
                        });
                    });
                });
            });
        });
    },

    // ============================================
    // АДМИНКА - ТОВАРЫ
    // ============================================
    adminProducts: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        Product.getAllAdmin(1, 100).then(function(products) {
            res.render('pages/admin/products', {
                title: 'Управление товарами',
                products: products || [],
                user: req.session.user
            });
        }).catch(function(err) {
            console.error('Admin products error:', err);
            res.render('pages/admin/products', {
                title: 'Управление товарами',
                products: [],
                user: req.session.user
            });
        });
    },

    adminProductAdd: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        db.all('SELECT * FROM categories ORDER BY sort_order', [], function(err, categories) {
            res.render('pages/admin/product-edit', {
                title: 'Добавление товара',
                product: null,
                categories: categories || [],
                isEdit: false,
                user: req.session.user
            });
        });
    },

    adminProductAddPost: function(req, res) {
        if (!req.session || !req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var name = req.body.name;
        var description = req.body.description;
        var price = req.body.price;
        var category_id = req.body.category_id;
        var volume = req.body.volume;
        var is_new = req.body.is_new;
        var is_popular = req.body.is_popular;
        var in_stock = req.body.in_stock ? 1 : 0;

        if (!name || name.trim() === '') {
            return res.redirect('/admin/products?error=' + encodeURIComponent('Название товара обязательно'));
        }

        var slug = name.toLowerCase().replace(/[^а-яa-z0-9]+/g, '-').replace(/^-|-$/g, '');

        var images = [];
        if (req.files && req.files.length > 0) {
            for (var i = 0; i < req.files.length; i++) {
                images.push('/uploads/products/' + req.files[i].filename);
            }
        }

        var imagesJson = JSON.stringify(images);

        db.run(
            'INSERT INTO products (name, slug, description, price, category_id, volume, in_stock, images, is_new, is_popular) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name.trim(),
                slug,
                description || '',
                parseFloat(price) || 0,
                category_id || null,
                volume || '',
                in_stock,
                imagesJson,
                is_new ? 1 : 0,
                is_popular ? 1 : 0
            ],
            function(err) {
                if (err) {
                    console.error('Add product error:', err);
                    return res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
                }
                res.redirect('/admin/products?success=Товар добавлен');
            }
        );
    },

    adminProductEdit: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var productId = req.params.id;
        Product.getById(productId).then(function(product) {
            if (!product) {
                return res.redirect('/admin/products?error=Товар не найден');
            }
            db.all('SELECT * FROM categories ORDER BY sort_order', [], function(err, categories) {
                res.render('pages/admin/product-edit', {
                    title: 'Редактирование товара',
                    product: product,
                    categories: categories || [],
                    isEdit: true,
                    user: req.session.user
                });
            });
        }).catch(function(err) {
            console.error('Edit product error:', err);
            res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
        });
    },

    adminProductEditPost: function(req, res) {
        if (!req.session || !req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var productId = req.params.id;
        var name = req.body.name;
        var description = req.body.description;
        var price = req.body.price;
        var category_id = req.body.category_id;
        var volume = req.body.volume;
        var is_new = req.body.is_new;
        var is_popular = req.body.is_popular;
        var in_stock = req.body.in_stock ? 1 : 0;

        if (!name || name.trim() === '') {
            return res.redirect('/admin/products/edit/' + productId + '?error=' + encodeURIComponent('Название товара обязательно'));
        }

        var slug = name.toLowerCase().replace(/[^а-яa-z0-9]+/g, '-').replace(/^-|-$/g, '');

        db.get('SELECT * FROM products WHERE id = ?', [productId], function(err, product) {
            if (err || !product) {
                console.error('❌ Товар не найден:', err);
                return res.redirect('/admin/products?error=Товар не найден');
            }

            var images = [];
            try {
                images = JSON.parse(product.images || '[]');
            } catch (e) {
                images = [];
            }

            if (req.files && req.files.length > 0) {
                for (var i = 0; i < req.files.length; i++) {
                    images.push('/uploads/products/' + req.files[i].filename);
                }
            }

            var imagesJson = JSON.stringify(images);

            db.run(
                'UPDATE products SET name = ?, slug = ?, description = ?, price = ?, category_id = ?, volume = ?, in_stock = ?, images = ?, is_new = ?, is_popular = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [
                    name.trim(),
                    slug,
                    description || '',
                    parseFloat(price) || 0,
                    category_id || null,
                    volume || '',
                    in_stock,
                    imagesJson,
                    is_new ? 1 : 0,
                    is_popular ? 1 : 0,
                    productId
                ],
                function(err) {
                    if (err) {
                        console.error('❌ Ошибка обновления:', err);
                        return res.redirect('/admin/products/edit/' + productId + '?error=' + encodeURIComponent(err.message));
                    }
                    console.log('✅ Товар обновлен, in_stock:', in_stock);
                    res.redirect('/admin/products?success=Товар обновлен');
                }
            );
        });
    },

    adminProductDelete: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var productId = req.params.id;
        Product.delete(productId).then(function() {
            res.redirect('/admin/products?success=Товар удален');
        }).catch(function(err) {
            console.error('Delete product error:', err);
            res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
        });
    },

    adminProductRemoveImage: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.status(401).json({ success: false });
        }

        var productId = req.params.id;
        var index = parseInt(req.params.index);

        Product.removeImage(productId, index).then(function() {
            res.json({ success: true });
        }).catch(function(err) {
            console.error('Remove image error:', err);
            res.status(500).json({ success: false, error: err.message });
        });
    },

    // ============================================
    // АДМИНКА - КАТЕГОРИИ
    // ============================================
    adminCategories: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        db.all('SELECT * FROM categories ORDER BY sort_order', [], function(err, categories) {
            res.render('pages/admin/categories', {
                title: 'Управление категориями',
                categories: categories || [],
                user: req.session.user
            });
        });
    },

    adminCategoryAdd: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var name = req.body.name;
        var description = req.body.description;
        var sort_order = req.body.sort_order;
        var slug = name.toLowerCase().replace(/[^а-яa-z0-9]+/g, '-').replace(/^-|-$/g, '');

        db.run(
            'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)',
            [name, slug, description || '', sort_order || 0],
            function(err) {
                if (err) {
                    console.error('Add category error:', err);
                    return res.redirect('/admin/categories?error=' + encodeURIComponent(err.message));
                }
                res.redirect('/admin/categories?success=Категория добавлена');
            }
        );
    },

    adminCategoryEdit: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var categoryId = req.params.id;
        var name = req.body.name;
        var description = req.body.description;
        var sort_order = req.body.sort_order;
        var slug = name.toLowerCase().replace(/[^а-яa-z0-9]+/g, '-').replace(/^-|-$/g, '');

        db.run(
            'UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ? WHERE id = ?',
            [name, slug, description || '', sort_order || 0, categoryId],
            function(err) {
                if (err) {
                    console.error('Edit category error:', err);
                    return res.redirect('/admin/categories?error=' + encodeURIComponent(err.message));
                }
                res.redirect('/admin/categories?success=Категория обновлена');
            }
        );
    },

    adminCategoryDelete: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var categoryId = req.params.id;
        db.run('DELETE FROM categories WHERE id = ?', [categoryId], function(err) {
            if (err) {
                console.error('Delete category error:', err);
                return res.redirect('/admin/categories?error=' + encodeURIComponent(err.message));
            }
            res.redirect('/admin/categories?success=Категория удалена');
        });
    },

    // ============================================
    // АДМИНКА - ЗАКАЗЫ
    // ============================================
    adminOrders: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        db.all('SELECT * FROM orders ORDER BY created_at DESC', [], function(err, orders) {
            res.render('pages/admin/orders', {
                title: 'Управление заказами',
                orders: orders || [],
                user: req.session.user
            });
        });
    },

    adminOrderDetail: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var orderId = req.params.id;
        db.get('SELECT * FROM orders WHERE id = ?', [orderId], function(err, order) {
            if (!order) {
                return res.redirect('/admin/orders?error=Заказ не найден');
            }

            db.all(
                'SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
                [orderId],
                function(err, items) {
                    res.render('pages/admin/order-detail', {
                        title: 'Детали заказа #' + order.order_number,
                        order: order,
                        items: items || [],
                        user: req.session.user
                    });
                }
            );
        });
    },

    adminOrderUpdateStatus: function(req, res) {
        if (!req.session.user || !req.session.user.is_admin) {
            return res.redirect('/login');
        }

        var orderId = req.params.id;
        var status = req.body.status;

        db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], function(err) {
            if (err) {
                console.error('Update order status error:', err);
                return res.redirect('/admin/orders/' + orderId + '?error=' + encodeURIComponent(err.message));
            }
            res.redirect('/admin/orders/' + orderId + '?success=Статус обновлен');
        });
    }
};

console.log('✅ mainController загружен');

module.exports = mainController;