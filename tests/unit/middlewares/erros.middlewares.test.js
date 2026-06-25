import { jest } from '@jest/globals';
import { naoEncontrado, middlewareDeErros } from '../../../src/middlewares/erros.middlewares.js';
import { AppError } from '../../../src/utils/AppError.js';

describe('Testes Unitários: Middlewares de Erro', () => {
    let req, res, next;
    const envOriginal = process.env.NODE_ENV;

    beforeEach(() => {
        req = {
            path: '/rota-qualquer',
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            render: jest.fn(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        process.env.NODE_ENV = envOriginal;
        jest.restoreAllMocks();
    });

    describe('naoEncontrado (Erro 404)', () => {
        it('deve retornar status 404 e renderizar a página de erro 404', () => {
            req.path = '/rota-fantasma';

            naoEncontrado(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.render).toHaveBeenCalledWith('erros/404', {
                titulo: 'Página não encontrada',
                mensagem: 'A página "/rota-fantasma" não existe.',
            });
        });
    });

    describe('middlewareDeErros', () => {
        it('deve retornar JSON quando a requisição aceitar application/json', () => {
            req.headers['accept'] = 'application/json';
            const erro = new AppError('Erro de API', 400);

            middlewareDeErros(erro, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Erro de API' });
        });

        it('deve renderizar a página EJS de erro quando for um AppError e a requisição for HTML', () => {
            req.headers['accept'] = 'text/html';
            const erro = new AppError('Acesso Negado Frontend', 403);

            middlewareDeErros(erro, req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.render).toHaveBeenCalledWith('erros/erro', {
                titulo: 'Erro 403',
                codigo: 403,
                mensagem: 'Acesso Negado Frontend',
            });
        });

        it('deve renderizar a página EJS com erro 500 para erros genéricos no ambiente de desenvolvimento', () => {
            req.headers['accept'] = 'text/html';
            const erroGenerico = new Error('Banco de dados caiu');

            middlewareDeErros(erroGenerico, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.render).toHaveBeenCalledWith('erros/erro', {
                titulo: 'Erro interno',
                codigo: 500,
                mensagem: 'Banco de dados caiu',
            });
        });

        it('deve ocultar os detalhes do erro genérico 500 se o ambiente for de Produção', () => {
            req.headers['accept'] = 'text/html';
            process.env.NODE_ENV = 'production';
            const erroGrave = new Error('Vazamento de memória e senhas');

            middlewareDeErros(erroGrave, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.render).toHaveBeenCalledWith('erros/erro', {
                titulo: 'Erro interno',
                codigo: 500,
                mensagem: 'Ocorreu um erro inesperado. Tente novamente.',
            });
        });

        it('deve acionar o console.error se não estiver no ambiente de teste', () => {
            process.env.NODE_ENV = 'development';
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const erro = new Error('Erro para o log');

            middlewareDeErros(erro, req, res, next);

            expect(consoleSpy).toHaveBeenCalledWith(erro);
        });
    });
});