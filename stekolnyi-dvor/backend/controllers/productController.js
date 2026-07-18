const db = require('../config/database');

console.log('🔄 Загрузка productController...');

// Простые функции-заглушки, которые точно работают
const productController = {
    // Главная страница
    index: async (req, res) => {
        try {
            console.log('📊 Загрузка главной страницы...');
            
            // Получаем новинки
            const newProducts = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM products WHERE is_new = 1 ORDER BY created_at DESC LIMIT 6`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    }
                );
            });

            // Получаем популярные товары
            const popularProducts = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM products WHERE is_popular = 1 ORDER BY created_at DESC LIMIT 10`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    }
                );
            });

            // Получаем категории
            const categories = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM categories ORDER BY sort_order`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    }
                );
            });

            console.log(`✅ Найдено новинок: ${newProducts.length}`);
            console.log(`✅ Найдено популярных: ${popularProducts.length}`);
            console.log(`✅ Найдено категорий: ${categories.length}`);

            // Рендерим страницу
            res.render('pages/index', {
                title: 'Стекольный двор - Стеклобанки и стеклобутылки',
                newProducts: newProducts || [],
                popularProducts: popularProducts || [],
                categories: categories || []
            });
        } catch (error) {
            console.error('❌ Index error:', error);
            // Если ошибка, показываем страницу с заглушкой
            res.render('pages/index', {
                title: 'Стекольный двор - Стеклобанки и стеклобутылки',
                newProducts: [],
                popularProducts: [],
                categories: []
            });
        }
    },

    // Каталог
    catalog: async (req, res) => {
        try {
            console.log('📊 Загрузка каталога...');
            
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const categorySlug = req.query.category;
            const search = req.query.search || '';

            // Получаем все категории
            const categories = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM categories ORDER BY sort_order`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    }
                );
            });

            // Формируем запрос для товаров
            let query = `
                SELECT p.*, c.name as category_name 
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE 1=1
            `;
            let params = [];

            if (search) {
                query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm);
            }

            let currentCategory = null;
            if (categorySlug) {
                currentCategory = categories.find(c => c.slug === categorySlug);
                if (currentCategory) {
                    query += ' AND p.category_id = ?';
                    params.push(currentCategory.id);
                }
            }

            const offset = (page - 1) * limit;
            query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            // Получаем товары
            const products = await new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows || []);
                });
            });

            // Получаем общее количество для пагинации
            let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
            let countParams = [];
            
            if (search) {
                countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
                countParams.push(`%${search}%`, `%${search}%`);
            }
            if (currentCategory) {
                countQuery += ' AND p.category_id = ?';
                countParams.push(currentCategory.id);
            }

            const totalResult = await new Promise((resolve, reject) => {
                db.get(countQuery, countParams, (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            const total = totalResult ? totalResult.total : 0;
            const totalPages = Math.ceil(total / limit);

            console.log(`✅ Найдено товаров: ${products.length} из ${total}`);

            res.render('pages/catalog', {
                title: 'Каталог товаров',
                products: products || [],
                categories: categories || [],
                currentCategory: currentCategory || null,
                search: search || '',
                pagination: {
                    currentPage: page,
                    totalPages: totalPages || 1,
                    limit: limit,
                    total: total || 0
                }
            });
        } catch (error) {
            console.error('❌ Catalog error:', error);
            res.render('pages/catalog', {
                title: 'Каталог товаров',
                products: [],
                categories: [],
                currentCategory: null,
                search: '',
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    limit: 20,
                    total: 0
                }
            });
        }
    },

    // Страница товара
    productDetail: async (req, res) => {
        try {
            const { slug } = req.params;
            console.log(`📊 Загрузка товара: ${slug}`);

            // Получаем товар по slug
            const product = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT p.*, c.name as category_name 
                     FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
                     WHERE p.slug = ?`,
                    [slug],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (!product) {
                return res.status(404).render('error', { 
                    message: 'Товар не найден',
                    title: '404 - Товар не найден'
                });
            }

            // Получаем категории для боковой панели
            const categories = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM categories ORDER BY sort_order`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    }
                );
            });

            console.log(`✅ Найден товар: ${product.name}`);

            res.render('pages/product', {
                title: product.name,
                product: product,
                categories: categories || []
            });
        } catch (error) {
            console.error('❌ Product detail error:', error);
            res.status(500).render('error', { 
                message: 'Ошибка загрузки товара: ' + error.message,
                title: 'Ошибка'
            });
        }
    }
};

console.log('✅ productController загружен, методы:', Object.keys(productController));

module.exports = productController;