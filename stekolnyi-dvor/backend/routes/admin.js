const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');

// Все маршруты админки требуют прав администратора
router.use(isAdmin);

// Дашборд
router.get('/', async (req, res) => {
    try {
        const stats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    (SELECT COUNT(*) FROM products) as total_products,
                    (SELECT COUNT(*) FROM categories) as total_categories,
                    (SELECT COUNT(*) FROM orders WHERE status = 'new') as new_orders,
                    (SELECT COUNT(*) FROM users) as total_users
            `, [], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        res.render('pages/admin/dashboard', {
            title: 'Админ-панель',
            stats
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки админ-панели' });
    }
});

// Управление товарами
router.get('/products', async (req, res) => {
    try {
        const products = await Product.getAll(1, 100);
        res.render('pages/admin/products', {
            title: 'Управление товарами',
            products
        });
    } catch (error) {
        console.error('Admin products error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки товаров' });
    }
});

// Добавление товара
router.get('/products/add', async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.render('pages/admin/product-edit', {
            title: 'Добавление товара',
            product: null,
            categories,
            isEdit: false
        });
    } catch (error) {
        console.error('Add product form error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки формы' });
    }
});

router.post('/products/add', upload.single('image'), async (req, res) => {
    try {
        const { 
            name, description, price, category_id, volume, stock,
            is_new, is_popular, is_exclusive 
        } = req.body;

        const slug = name
            .toLowerCase()
            .replace(/[^а-яa-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

        await Product.create({
            name,
            slug,
            description,
            price: parseFloat(price),
            category_id: category_id || null,
            volume,
            stock: stock || 0,
            image_url,
            is_new: is_new ? 1 : 0,
            is_popular: is_popular ? 1 : 0,
            is_exclusive: is_exclusive ? 1 : 0
        });

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).render('error', { message: 'Ошибка добавления товара' });
    }
});

// Редактирование товара
router.get('/products/edit/:id', async (req, res) => {
    try {
        const product = await Product.getById(req.params.id);
        if (!product) {
            return res.status(404).render('error', { message: 'Товар не найден' });
        }
        const categories = await Category.getAll();
        res.render('pages/admin/product-edit', {
            title: 'Редактирование товара',
            product,
            categories,
            isEdit: true
        });
    } catch (error) {
        console.error('Edit product form error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки формы' });
    }
});

router.post('/products/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { 
            name, description, price, category_id, volume, stock,
            is_new, is_popular, is_exclusive 
        } = req.body;

        const product = await Product.getById(req.params.id);
        if (!product) {
            return res.status(404).render('error', { message: 'Товар не найден' });
        }

        const slug = name
            .toLowerCase()
            .replace(/[^а-яa-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let image_url = product.image_url;
        if (req.file) {
            image_url = `/uploads/products/${req.file.filename}`;
        }

        await Product.update(req.params.id, {
            name,
            slug,
            description,
            price: parseFloat(price),
            category_id: category_id || null,
            volume,
            stock: stock || 0,
            image_url,
            is_new: is_new ? 1 : 0,
            is_popular: is_popular ? 1 : 0,
            is_exclusive: is_exclusive ? 1 : 0
        });

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Edit product error:', error);
        res.status(500).render('error', { message: 'Ошибка обновления товара' });
    }
});

// Удаление товара
router.post('/products/delete/:id', async (req, res) => {
    try {
        await Product.delete(req.params.id);
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).render('error', { message: 'Ошибка удаления товара' });
    }
});

// Управление категориями
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.render('pages/admin/categories', {
            title: 'Управление категориями',
            categories
        });
    } catch (error) {
        console.error('Admin categories error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки категорий' });
    }
});

router.post('/categories/add', async (req, res) => {
    try {
        const { name, description, sort_order } = req.body;
        const slug = name
            .toLowerCase()
            .replace(/[^а-яa-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        await Category.create({ name, slug, description, sort_order: sort_order || 0 });
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Add category error:', error);
        res.status(500).render('error', { message: 'Ошибка добавления категории' });
    }
});

router.post('/categories/edit/:id', async (req, res) => {
    try {
        const { name, description, sort_order } = req.body;
        const slug = name
            .toLowerCase()
            .replace(/[^а-яa-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        await Category.update(req.params.id, { name, slug, description, sort_order: sort_order || 0 });
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Edit category error:', error);
        res.status(500).render('error', { message: 'Ошибка обновления категории' });
    }
});

router.post('/categories/delete/:id', async (req, res) => {
    try {
        await Category.delete(req.params.id);
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).render('error', { message: 'Ошибка удаления категории' });
    }
});

// Управление заказами
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.getAll(100, 0);
        res.render('pages/admin/orders', {
            title: 'Управление заказами',
            orders
        });
    } catch (error) {
        console.error('Admin orders error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки заказов' });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.getById(req.params.id);
        if (!order) {
            return res.status(404).render('error', { message: 'Заказ не найден' });
        }
        const items = await Order.getItems(req.params.id);
        res.render('pages/admin/order-detail', {
            title: 'Детали заказа',
            order,
            items
        });
    } catch (error) {
        console.error('Order detail error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки заказа' });
    }
});

router.post('/orders/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await Order.updateStatus(req.params.id, status);
        res.redirect(`/admin/orders/${req.params.id}`);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).render('error', { message: 'Ошибка обновления статуса заказа' });
    }
});

// Экспортируем router (а не объект!)
console.log('✅ admin.js: экспортируем router');
module.exports = router;