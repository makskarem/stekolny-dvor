const db = require('../config/database');
const bcrypt = require('bcrypt');

console.log('🌱 Начинаем наполнение базы данных тестовыми данными...');

// Категории товаров
const categories = [
    { name: 'Бутылки для крепких напитков', slug: 'butylki-dlya-krepkih-napitkov' },
    { name: 'Наборы бутылок', slug: 'nabory-butylok' },
    { name: 'Штофы и графины', slug: 'shtofy-i-grafiny' },
    { name: 'Декорированные бутылки', slug: 'dekorirovannye-butylki' },
    { name: 'Бутыли и банки для виноделия', slug: 'butyli-i-banki-dlya-vinodeliya' },
    { name: 'Винные бутылки', slug: 'vinnye-butylki' },
    { name: 'Винные графины', slug: 'vinnye-grafiny' },
    { name: 'Емкости стеклянные с краном', slug: 'emkosti-steklyannye-s-kranom' },
    { name: 'Банки твист-офф', slug: 'banki-twist-off' },
    { name: 'Стеклобанка СКО', slug: 'steklobanka-sko' },
    { name: 'Стеклянная банка для мёда', slug: 'steklyannaya-banka-dlya-meda' },
    { name: 'Стеклянные банки для икры', slug: 'steklyannye-banki-dlya-ikry' },
    { name: 'Бутылки для масла, уксуса, соков', slug: 'butylki-dlya-masla-uksusa-sokov' },
    { name: 'Стаканы', slug: 'stakany' },
    { name: 'Банки стеклянные с бугельным замком', slug: 'banki-steklyannye-s-bugelnym-zamkom' },
    { name: 'Лимонадники', slug: 'limonadniki' },
    { name: 'Пробки, колпачки и прочее', slug: 'probki-kolpachki-i-prochee' }
];

// Товары
const products = [
    // Винные бутылки
    {
        name: 'Бутылка для вина 0.75л зеленая',
        slug: 'butylka-dlya-vina-075l-zelenaya',
        description: 'Классическая винная бутылка из зеленого стекла объемом 0.75 литра. Идеально подходит для разлива вина.',
        price: 45.00,
        category_id: 6,
        volume: '0.75 л',
        stock: 100,
        is_new: 1,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Бутылка для вина 0.75л прозрачная',
        slug: 'butylka-dlya-vina-075l-prozrachnaya',
        description: 'Классическая винная бутылка из прозрачного стекла объемом 0.75 литра. Отлично подходит для белых вин.',
        price: 42.00,
        category_id: 6,
        volume: '0.75 л',
        stock: 120,
        is_new: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Бутылка для вина 1л темная',
        slug: 'butylka-dlya-vina-1l-temnaya',
        description: 'Винная бутылка из темного стекла объемом 1 литр. Защищает напиток от солнечного света.',
        price: 55.00,
        category_id: 6,
        volume: '1 л',
        stock: 80,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },

    // Банки твист-офф
    {
        name: 'Банка твист-офф 0.5л',
        slug: 'banka-twist-off-05l',
        description: 'Стеклянная банка с крышкой твист-офф объемом 0.5 литра. Идеально для домашних заготовок.',
        price: 35.00,
        category_id: 9,
        volume: '0.5 л',
        stock: 200,
        is_new: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Банка твист-офф 1л',
        slug: 'banka-twist-off-1l',
        description: 'Стеклянная банка с крышкой твист-офф объемом 1 литр. Отлично подходит для варенья и солений.',
        price: 65.00,
        category_id: 9,
        volume: '1 л',
        stock: 150,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Банка твист-офф 2л',
        slug: 'banka-twist-off-2l',
        description: 'Большая стеклянная банка с крышкой твист-офф объемом 2 литра. Для больших объемов заготовок.',
        price: 95.00,
        category_id: 9,
        volume: '2 л',
        stock: 100,
        image_url: '/images/placeholder.jpg'
    },

    // Штофы и графины
    {
        name: 'Графин стеклянный 0.5л классический',
        slug: 'grafin-steklyannyj-05l-klassicheskij',
        description: 'Элегантный стеклянный графин объемом 0.5 литра. Классическая форма для подачи напитков.',
        price: 120.00,
        category_id: 3,
        volume: '0.5 л',
        stock: 50,
        is_exclusive: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Графин стеклянный 0.7л с пробкой',
        slug: 'grafin-steklyannyj-07l-s-probkoj',
        description: 'Стеклянный графин с пробкой объемом 0.7 литра. Идеально для виски или коньяка.',
        price: 180.00,
        category_id: 3,
        volume: '0.7 л',
        stock: 30,
        is_exclusive: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Штоф стеклянный 0.5л с рисунком',
        slug: 'shtof-steklyannyj-05l-s-risunkom',
        description: 'Стеклянный штоф с декоративным рисунком объемом 0.5 литра. Отличный подарок.',
        price: 250.00,
        category_id: 3,
        volume: '0.5 л',
        stock: 20,
        is_exclusive: 1,
        image_url: '/images/placeholder.jpg'
    },

    // Банки для меда и икры
    {
        name: 'Банка для меда 0.5л',
        slug: 'banka-dlya-meda-05l',
        description: 'Стеклянная банка для меда объемом 0.5 литра. Удобная форма и плотная крышка.',
        price: 55.00,
        category_id: 11,
        volume: '0.5 л',
        stock: 180,
        is_new: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Банка для меда 1л',
        slug: 'banka-dlya-meda-1l',
        description: 'Большая стеклянная банка для меда объемом 1 литр. Отлично подходит для хранения.',
        price: 75.00,
        category_id: 11,
        volume: '1 л',
        stock: 120,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Банка для икры 0.2л',
        slug: 'banka-dlya-ikry-02l',
        description: 'Маленькая стеклянная банка для икры объемом 0.2 литра. Идеально для деликатесов.',
        price: 30.00,
        category_id: 12,
        volume: '0.2 л',
        stock: 250,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Банка для икры 0.5л',
        slug: 'banka-dlya-ikry-05l',
        description: 'Стеклянная банка для икры объемом 0.5 литра. Отлично подходит для домашних заготовок.',
        price: 45.00,
        category_id: 12,
        volume: '0.5 л',
        stock: 150,
        image_url: '/images/placeholder.jpg'
    },

    // Бутылки для масла и уксуса
    {
        name: 'Бутылка для масла 0.5л',
        slug: 'butylka-dlya-masla-05l',
        description: 'Стеклянная бутылка для растительного масла объемом 0.5 литра. Удобный дозатор.',
        price: 75.00,
        category_id: 13,
        volume: '0.5 л',
        stock: 80,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Бутылка для уксуса 0.3л',
        slug: 'butylka-dlya-uksusa-03l',
        description: 'Стеклянная бутылка для уксуса объемом 0.3 литра. Специальная форма для удобного использования.',
        price: 65.00,
        category_id: 13,
        volume: '0.3 л',
        stock: 100,
        is_new: 1,
        image_url: '/images/placeholder.jpg'
    },

    // Бутыли для виноделия
    {
        name: 'Бутыль стеклянная 3л для виноделия',
        slug: 'butyl-steklyannaya-3l-dlya-vinodeliya',
        description: 'Стеклянная бутыль объемом 3 литра для домашнего виноделия. Толстое стекло, удобная форма.',
        price: 350.00,
        category_id: 5,
        volume: '3 л',
        stock: 40,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Бутыль стеклянная 5л для виноделия',
        slug: 'butyl-steklyannaya-5l-dlya-vinodeliya',
        description: 'Большая стеклянная бутыль объемом 5 литров для виноделия. Идеально для брожения.',
        price: 450.00,
        category_id: 5,
        volume: '5 л',
        stock: 30,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },

    // Декорированные бутылки
    {
        name: 'Бутылка декорированная 0.5л золотая',
        slug: 'butylka-dekorirovannaya-05l-zolotaya',
        description: 'Декорированная стеклянная бутылка с золотым напылением объемом 0.5 литра. Отличный сувенир.',
        price: 280.00,
        category_id: 4,
        volume: '0.5 л',
        stock: 25,
        is_exclusive: 1,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Бутылка декорированная 0.7л серебряная',
        slug: 'butylka-dekorirovannaya-07l-serebryanaya',
        description: 'Декорированная стеклянная бутылка с серебряным покрытием объемом 0.7 литра. Эксклюзивный дизайн.',
        price: 320.00,
        category_id: 4,
        volume: '0.7 л',
        stock: 15,
        is_exclusive: 1,
        image_url: '/images/placeholder.jpg'
    },

    // Наборы бутылок
    {
        name: 'Набор винных бутылок 6шт 0.75л',
        slug: 'nabor-vinnyh-butylok-6sht-075l',
        description: 'Набор из 6 виноградных бутылок объемом 0.75 литра каждая. Отлично подходит для начинающих виноделов.',
        price: 240.00,
        category_id: 2,
        volume: '0.75 л',
        stock: 50,
        is_new: 1,
        image_url: '/images/placeholder.jpg'
    },

    // Лимонадники
    {
        name: 'Лимонадник стеклянный 1л',
        slug: 'limonadnik-steklyannyj-1l',
        description: 'Стеклянный лимонадник объемом 1 литр. Идеально для подачи лимонада и других напитков.',
        price: 180.00,
        category_id: 16,
        volume: '1 л',
        stock: 35,
        image_url: '/images/placeholder.jpg'
    },

    // Стаканы
    {
        name: 'Стакан стеклянный 0.2л набор 6шт',
        slug: 'stakan-steklyannyj-02l-nabor-6sht',
        description: 'Набор из 6 стеклянных стаканов объемом 0.2 литра каждый. Отлично подходят для подачи напитков.',
        price: 120.00,
        category_id: 14,
        volume: '0.2 л',
        stock: 60,
        is_popular: 1,
        image_url: '/images/placeholder.jpg'
    },

    // Пробки и колпачки
    {
        name: 'Пробка виноградная натуральная 25шт',
        slug: 'probka-vinogradnaya-naturalnaya-25sht',
        description: 'Набор натуральных виноградных пробок для виноделия. 25 штук в упаковке.',
        price: 150.00,
        category_id: 17,
        volume: '',
        stock: 100,
        image_url: '/images/placeholder.jpg'
    },
    {
        name: 'Колпачок для бутылки 50шт',
        slug: 'kolpachok-dlya-butylki-50sht',
        description: 'Набор колпачков для бутылок. Подходит для твист-офф и других бутылок. 50 штук.',
        price: 80.00,
        category_id: 17,
        volume: '',
        stock: 150,
        image_url: '/images/placeholder.jpg'
    }
];

// Функция для вставки категорий
function insertCategories() {
    return new Promise((resolve, reject) => {
        let inserted = 0;
        categories.forEach((cat, index) => {
            db.run(
                `INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, ?)`,
                [cat.name, cat.slug, index],
                function(err) {
                    if (err) {
                        console.error(`❌ Ошибка вставки категории "${cat.name}":`, err.message);
                    } else {
                        console.log(`✅ Добавлена категория: ${cat.name}`);
                        inserted++;
                    }
                    if (index === categories.length - 1) {
                        resolve(inserted);
                    }
                }
            );
        });
    });
}

// Функция для вставки товаров
function insertProducts() {
    return new Promise((resolve, reject) => {
        let inserted = 0;
        products.forEach((product, index) => {
            db.run(
                `INSERT OR IGNORE INTO products 
                 (name, slug, description, price, category_id, volume, stock, 
                  is_new, is_popular, is_exclusive, image_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    product.name,
                    product.slug,
                    product.description,
                    product.price,
                    product.category_id,
                    product.volume || '',
                    product.stock || 0,
                    product.is_new || 0,
                    product.is_popular || 0,
                    product.is_exclusive || 0,
                    product.image_url || '/images/placeholder.jpg'
                ],
                function(err) {
                    if (err) {
                        console.error(`❌ Ошибка вставки товара "${product.name}":`, err.message);
                    } else {
                        console.log(`✅ Добавлен товар: ${product.name} (${product.price} ₽)`);
                        inserted++;
                    }
                    if (index === products.length - 1) {
                        resolve(inserted);
                    }
                }
            );
        });
    });
}

// Функция для создания администратора
function createAdmin() {
    return new Promise((resolve, reject) => {
        const adminPassword = bcrypt.hashSync('admin123', 10);
        db.run(
            `INSERT OR IGNORE INTO users (username, email, password_hash, full_name, is_admin) 
             VALUES (?, ?, ?, ?, ?)`,
            ['admin', 'admin@stekolnyi-dvor.ru', adminPassword, 'Администратор', 1],
            function(err) {
                if (err) {
                    console.error('❌ Ошибка создания администратора:', err.message);
                } else {
                    if (this.changes > 0) {
                        console.log('✅ Создан администратор: admin@stekolnyi-dvor.ru / admin123');
                    } else {
                        console.log('ℹ️ Администратор уже существует');
                    }
                }
                resolve();
            }
        );
    });
}

// Основная функция
async function seedDatabase() {
    console.log('\n📦 Начинаем наполнение базы данных...\n');

    try {
        // Вставляем категории
        console.log('📂 Добавление категорий...');
        const categoriesCount = await insertCategories();
        console.log(`✅ Добавлено категорий: ${categoriesCount}\n`);

        // Вставляем товары
        console.log('📦 Добавление товаров...');
        const productsCount = await insertProducts();
        console.log(`✅ Добавлено товаров: ${productsCount}\n`);

        // Создаем администратора
        console.log('👤 Создание администратора...');
        await createAdmin();
        console.log('✅ Администратор создан\n');

        // Показываем статистику
        console.log('📊 Статистика базы данных:');
        db.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
            console.log(`   Категории: ${row ? row.count : 0}`);
        });
        db.get('SELECT COUNT(*) as count FROM products', [], (err, row) => {
            console.log(`   Товары: ${row ? row.count : 0}`);
        });
        db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
            console.log(`   Пользователи: ${row ? row.count : 0}`);
        });

        console.log('\n✅ База данных успешно наполнена!');
        console.log('🔑 Администратор: admin@stekolnyi-dvor.ru');
        console.log('🔐 Пароль: admin123');
        console.log('\n🌐 Открой http://localhost:3000 и проверь товары!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка при наполнении базы данных:', error);
        process.exit(1);
    }
}

// Запускаем скрипт
seedDatabase();