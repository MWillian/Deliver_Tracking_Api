import { verificarAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

export const autenticar = (req, res, next) => {
    let token;
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    const isApi = req.originalUrl.startsWith('/api');
    if (!token) {
        if (!isApi) return res.redirect('/login');

        return next(new AppError('Token não fornecido', 401));
    }


    try {
        const payload = verificarAccessToken(token);
        req.usuario = payload;
        next();
    } catch (err) {
        if (!isApi) return res.redirect('/login');

        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Token expirado', 401));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new AppError('Token inválido', 401));
        }
        next(err);
    }
};

export const autorizar = (...papeis) => {
    return (req, res, next) => {
        const isApi = req.originalUrl.startsWith('/api');
        if (!req.usuario || !papeis.includes(req.usuario.papel)) {
            if (!isApi) {
                req.flash('erro', 'Acesso negado. Apenas gestores podem realizar esta ação.');
                return res.redirect('/painel');
            }
            return next(new AppError('Acesso negado', 403));
        }
        next();
    };
};