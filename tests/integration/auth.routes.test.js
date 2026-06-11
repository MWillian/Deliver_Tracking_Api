import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Testes de Integração: Rotas de Autenticação (/api/auth)', () => {

    beforeEach(async () => {
        try { await prisma.refreshToken.deleteMany(); } catch (e) { }
        await prisma.usuario.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it('deve register um usuário com dados válidos (201) e não retornar a senha', async () => {
            const resposta = await request(app)
                .post('/api/auth/register')
                .set('Accept', 'application/json') 
                .send({
                    nome: 'Usuário Teste',
                    email: 'teste@teste.com',
                    senha: 'senha_segura_123'
                });

            expect(resposta.status).toBe(201);
            expect(resposta.body).toHaveProperty('id');
            expect(resposta.body.email).toBe('teste@teste.com');
            expect(resposta.body).not.toHaveProperty('senha');

            const usuarioNoBanco = await prisma.usuario.findUnique({ where: { email: 'teste@teste.com' } });
            expect(usuarioNoBanco).not.toBeNull();
        });

        it('deve retornar status 400 ao tentar register com senha com menos de 8 caracteres', async () => {
            const resposta = await request(app)
                .post('/api/auth/register')
                .set('Accept', 'application/json')
                .send({ nome: 'Usuário Teste', email: 'curto@teste.com', senha: '123' });

            expect(resposta.status).toBe(400);
        });

        it('deve retornar status 409 ao tentar register com e-mail já cadastrado', async () => {
            await prisma.usuario.create({
                data: { nome: 'Existente', email: 'duplicado@teste.com', senha: 'hash', papel: 'OPERADOR' }
            });

            const resposta = await request(app)
                .post('/api/auth/register')
                .set('Accept', 'application/json')
                .send({ nome: 'Novo', email: 'duplicado@teste.com', senha: 'senha_valida_123' });

            expect(resposta.status).toBe(409);
        });
    });

    describe('POST /api/auth/login', () => {
        it('deve realizar login com credenciais válidas e retornar os tokens (200)', async () => {
            const senhaPlana = 'senha_segura_123';
            const senhaHash = await bcrypt.hash(senhaPlana, 10);

            await prisma.usuario.create({
                data: { nome: 'Login Valido', email: 'login@teste.com', senha: senhaHash, papel: 'OPERADOR' }
            });

            const resposta = await request(app)
                .post('/api/auth/login')
                .set('Accept', 'application/json')
                .send({ email: 'login@teste.com', senha: senhaPlana });

            expect(resposta.status).toBe(200);
            expect(resposta.body).toHaveProperty('accessToken');
            expect(resposta.body).toHaveProperty('refreshToken');
        });

        it('deve retornar 401 e "Credenciais inválidas" ao errar a senha', async () => {
            await prisma.usuario.create({
                data: { nome: 'Senha Errada', email: 'errada@teste.com', senha: await bcrypt.hash('senha_correta', 10), papel: 'OPERADOR' }
            });

            const resposta = await request(app)
                .post('/api/auth/login')
                .set('Accept', 'application/json')
                .send({ email: 'errada@teste.com', senha: 'senha_errada_aqui' });

            expect(resposta.status).toBe(401);
            expect(resposta.body.message).toBe('Credenciais inválidas');
        });

        it('deve retornar 401 e a MESMA mensagem "Credenciais inválidas" ao usar e-mail inexistente', async () => {
            const resposta = await request(app)
                .post('/api/auth/login')
                .set('Accept', 'application/json')
                .send({ email: 'fantasma@teste.com', senha: 'qualquer_senha' });

            expect(resposta.status).toBe(401);
            expect(resposta.body.message).toBe('Credenciais inválidas');
        });
    });
});