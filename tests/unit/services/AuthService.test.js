import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AppError } from '../../../src/utils/AppError.js';

jest.unstable_mockModule('bcrypt', () => ({
    default: {
        hash: jest.fn(),
        compare: jest.fn()
    }
}));

jest.unstable_mockModule('../../../src/utils/jwt.js', () => ({
    gerarAccessToken: jest.fn(),
    gerarRefreshToken: jest.fn()
}));

const bcrypt = (await import('bcrypt')).default;
const jwt = await import('../../../src/utils/jwt.js');
const { AuthService } = await import('../../../src/services/auth.service.js');

function criarUsuariosRepoFalso(overrides = {}) {
    return {
        buscarPorEmail: jest.fn(),
        criar: jest.fn(),
        ...overrides,
    };
}

describe('AuthService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registrar', () => {
        it('deve lançar AppError com status 409 quando o e-mail já estiver cadastrado', async () => {
            const repo = criarUsuariosRepoFalso({
                buscarPorEmail: jest.fn().mockResolvedValue({ id: 1, email: 'teste@teste.com' })
            });
            const service = new AuthService(repo);
            const dados = { nome: 'João', email: 'teste@teste.com', senha: 'senhas_segura123' };

            await expect(service.registrar(dados))
                .rejects
                .toMatchObject({ statusCode: 409, message: 'E-mail já cadastrado' });

            expect(repo.criar).not.toHaveBeenCalled();
        });

        it('deve registrar com sucesso, usar bcrypt para hash e omitir a senha no retorno', async () => {
            const usuarioCriadoNoBanco = { id: 1, nome: 'João', email: 'novo@teste.com', senha: 'senha_criptografada', papel: 'OPERADOR' };
            const repo = criarUsuariosRepoFalso({
                buscarPorEmail: jest.fn().mockResolvedValue(null),
                criar: jest.fn().mockResolvedValue(usuarioCriadoNoBanco)
            });

            bcrypt.hash.mockResolvedValue('senha_criptografada');

            const service = new AuthService(repo);
            const dados = { nome: 'João', email: 'novo@teste.com', senha: 'senha_plana' };

            const resultado = await service.registrar(dados);

            expect(bcrypt.hash).toHaveBeenCalledWith('senha_plana', 10);
            expect(repo.criar).toHaveBeenCalledWith(expect.objectContaining({ senha: 'senha_criptografada' }));
            expect(resultado).not.toHaveProperty('senha');
            expect(resultado).toHaveProperty('id', 1);
        });
    });

    describe('login', () => {
        it('deve lançar AppError com status 401 quando o e-mail não existir', async () => {
            const repo = criarUsuariosRepoFalso({
                buscarPorEmail: jest.fn().mockResolvedValue(null)
            });
            const service = new AuthService(repo);

            await expect(service.login('fantasma@teste.com', '123'))
                .rejects
                .toMatchObject({ statusCode: 401, message: 'Credenciais inválidas' });
        });

        it('deve lançar AppError com status 401 quando a senha estiver incorreta', async () => {
            const usuarioDoBanco = { id: 1, email: 'teste@teste.com', senha: 'senha_certa' };
            const repo = criarUsuariosRepoFalso({
                buscarPorEmail: jest.fn().mockResolvedValue(usuarioDoBanco)
            });

            bcrypt.compare.mockResolvedValue(false);

            const service = new AuthService(repo);

            await expect(service.login('teste@teste.com', 'senha_errada'))
                .rejects
                .toMatchObject({ statusCode: 401, message: 'Credenciais inválidas' });
        });

        it('deve realizar login com sucesso e retornar tokens e payload do usuário', async () => {
            const usuarioDoBanco = { id: 1, nome: 'Maria', email: 'maria@teste.com', senha: 'hash', papel: 'OPERADOR' };
            const repo = criarUsuariosRepoFalso({
                buscarPorEmail: jest.fn().mockResolvedValue(usuarioDoBanco)
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.gerarAccessToken.mockReturnValue('mock-access-token');
            jwt.gerarRefreshToken.mockReturnValue('mock-refresh-token');

            const service = new AuthService(repo);

            const resultado = await service.login('maria@teste.com', 'senha_correta');

            expect(bcrypt.compare).toHaveBeenCalledWith('senha_correta', 'hash');
            expect(jwt.gerarAccessToken).toHaveBeenCalled();
            expect(resultado.accessToken).toBe('mock-access-token');
            expect(resultado.refreshToken).toBe('mock-refresh-token');
            expect(resultado.usuario).toEqual({ id: 1, nome: 'Maria', email: 'maria@teste.com', papel: 'OPERADOR' });
            expect(resultado.usuario).not.toHaveProperty('senha');
        });
    });
});