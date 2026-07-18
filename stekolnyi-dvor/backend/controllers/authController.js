const User = require('../models/User');

exports.showLogin = (req, res) => {
    res.render('pages/login', { 
        title: 'Вход',
        error: null 
    });
};

exports.showRegister = (req, res) => {
    res.render('pages/register', { 
        title: 'Регистрация',
        error: null 
    });
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Находим пользователя
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.render('pages/login', { 
                title: 'Вход',
                error: 'Пользователь с таким email не найден' 
            });
        }

        // Проверяем пароль
        if (!User.verifyPassword(user, password)) {
            return res.render('pages/login', { 
                title: 'Вход',
                error: 'Неверный пароль' 
            });
        }

        // Создаем сессию
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            is_admin: user.is_admin
        };

        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('pages/login', { 
            title: 'Вход',
            error: 'Произошла ошибка при входе' 
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, email, password, confirm_password, full_name, phone, address } = req.body;

        // Валидация
        if (password !== confirm_password) {
            return res.render('pages/register', { 
                title: 'Регистрация',
                error: 'Пароли не совпадают' 
            });
        }

        if (password.length < 6) {
            return res.render('pages/register', { 
                title: 'Регистрация',
                error: 'Пароль должен содержать минимум 6 символов' 
            });
        }

        // Создаем пользователя
        const result = await User.create({
            username,
            email,
            password,
            full_name,
            phone,
            address
        });

        // Автоматически входим после регистрации
        const user = await User.findById(result.id);
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            is_admin: user.is_admin
        };

        res.redirect('/');
    } catch (error) {
        console.error('Register error:', error);
        let errorMessage = 'Произошла ошибка при регистрации';
        if (error.message.includes('UNIQUE constraint failed')) {
            errorMessage = 'Пользователь с таким email или именем уже существует';
        }
        res.render('pages/register', { 
            title: 'Регистрация',
            error: errorMessage 
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
};

exports.profile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        res.render('pages/profile', { 
            title: 'Личный кабинет',
            user: user 
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки профиля' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;
        await User.update(req.session.user.id, { full_name, phone, address });
        
        // Обновляем данные в сессии
        req.session.user.full_name = full_name;
        
        res.redirect('/profile');
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).render('error', { message: 'Ошибка обновления профиля' });
    }
};