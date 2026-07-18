const express = require('express');
const router = express.Router();

// Импортируем контроллеры
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const { isAuthenticated, isAdmin, isGuest } = require('../middleware/auth');

// Главная страница
router.get('/', productController.index);

// Каталог
router.get('/catalog', productController.catalog);
router.get('/catalog/:slug', productController.productDetail);

// Корзина
router.get('/cart', cartController.getCart);
router.post('/cart/add', cartController.addToCart);
router.post('/cart/update', cartController.updateCart);
router.delete('/cart/remove/:item_id', cartController.removeFromCart);

// Оформление заказа
router.get('/checkout', isAuthenticated, orderController.showCheckout);
router.post('/checkout', isAuthenticated, orderController.createOrder);
router.get('/order-success/:id', orderController.orderSuccess);

// Аутентификация
router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, authController.login);
router.get('/register', isGuest, authController.showRegister);
router.post('/register', isGuest, authController.register);
router.get('/logout', authController.logout);
router.get('/profile', isAuthenticated, authController.profile);
router.post('/profile', isAuthenticated, authController.updateProfile);

// Экспортируем router (а не объект!)
console.log('✅ index.js: экспортируем router');
module.exports = router;