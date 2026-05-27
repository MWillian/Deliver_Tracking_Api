import { AppError } from '../utils/AppError.js';
import bcrypt from 'bcrypt';
import { gerarAccessToken } from '../utils/jwt.js';

export class AuthService {
    constructor(usuariosRepository) {
        this.usuariosRepository = usuariosRepository;
    }

    async registrar(dados) {
        const { nome, email, senha } = dados;

        if (!nome || !email || !senha) {
            throw new AppError('Nome, e-mail e senha são obrigatórios', 400);
        }

        const usuarioExistente = await this.usuariosRepository.buscarPorEmail(email);
        if (usuarioExistente) {
            throw new AppError('E-mail já cadastrado', 409);
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const novoUsuario = await this.usuariosRepository.criar({
            nome,
            email,
            senha: senhaHash,
            papel: 'OPERADOR'
        });

        const { senha: _, ...usuarioRetorno } = novoUsuario;
        return usuarioRetorno;
    }

    async login(email, senhaBruta) {
        if (!email || !senhaBruta) {
            throw new AppError('E-mail e senha são obrigatórios', 400);
        }

        const usuario = await this.usuariosRepository.buscarPorEmail(email);
        if (!usuario) {
            throw new AppError('Credenciais inválidas', 401);
        }

        const senhaValida = await bcrypt.compare(senhaBruta, usuario.senha);
        if (!senhaValida) {
            throw new AppError('Credenciais inválidas', 401);
        }

        const payload = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            papel: usuario.papel
        };

        const accessToken = gerarAccessToken(payload);

        return {
            accessToken,
            usuario: payload
        };
    }
}