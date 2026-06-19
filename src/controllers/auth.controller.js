export class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.registrar = this.registrar.bind(this);
        this.login = this.login.bind(this);
    }

    async registrar(req, res, next) {
        try {
            const usuario = await this.authService.registrar(req.body);
            res.status(201).json(usuario);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, senha } = req.body;
            const resultado = await this.authService.login(email, senha);
            res.cookie('token', resultado.accessToken, {
                maxAge: 8 * 60 * 60 * 1000,
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });

            res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    }
}