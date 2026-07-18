// Проверка, авторизован ли пользователь
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Проверка, является ли пользователь администратором
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.is_admin) {
        next();
    } else {
        res.status(403).render('error', { 
            message: 'Доступ запрещен. Требуются права администратора.' 
        });
    }
}

// Проверка, не авторизован ли пользователь (для страниц login/register)
function isGuest(req, res, next) {
    if (!req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
}

module.exports = { isAuthenticated, isAdmin, isGuest };