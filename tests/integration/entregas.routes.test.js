import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Testes de Integração: Segurança das Rotas de Entregas (/api/entregas)', () => {

    let tokenOperadorValido;
    let tokenGestorValido;
    let usuarioOperador;
    let usuarioGestor;

    beforeEach(async () => {
        try { await prisma.eventoEntrega.deleteMany(); } catch (e) { }
        try { await prisma.entrega.deleteMany(); } catch (e) { }
        await prisma.usuario.deleteMany();

        usuarioOperador = await prisma.usuario.create({
            data: { nome: 'Op Teste', email: 'op@teste.com', senha: 'hash', papel: 'OPERADOR' }
        });

        usuarioGestor = await prisma.usuario.create({
            data: { nome: 'Gestor Teste', email: 'gestor@teste.com', senha: 'hash', papel: 'GESTOR' }
        });

        tokenOperadorValido = jwt.sign(
            { id: usuarioOperador.id, nome: usuarioOperador.nome, email: usuarioOperador.email, papel: 'OPERADOR' },
            process.env.JWT_SECRET
        );

        tokenGestorValido = jwt.sign(
            { id: usuarioGestor.id, nome: usuarioGestor.nome, email: usuarioGestor.email, papel: 'GESTOR' },
            process.env.JWT_SECRET
        );
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('deve retornar status 401 quando nenhuma credencial for fornecida', async () => {
        const resposta = await request(app)
            .get('/api/entregas')
            .set('Accept', 'application/json');

        expect(resposta.status).toBe(401);
        expect(resposta.body.message).toBe('Token não fornecido');
    });

    it('deve retornar status 401 quando o token tiver assinatura inválida', async () => {
        const tokenAdulterado = tokenOperadorValido + 'adulterado123';

        const resposta = await request(app)
            .get('/api/entregas')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${tokenAdulterado}`);

        expect(resposta.status).toBe(401);
        expect(resposta.body.message).toBe('Token inválido');
    });

    it('deve retornar status 401 e conter a palavra "expirado" quando o token estiver vencido', async () => {
        const tokenExpirado = jwt.sign(
            { id: usuarioOperador.id, papel: 'OPERADOR' },
            process.env.JWT_SECRET,
            { expiresIn: -1 }
        );

        const resposta = await request(app)
            .get('/api/entregas')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${tokenExpirado}`);

        expect(resposta.status).toBe(401);
        expect(resposta.body.message.toLowerCase()).toContain('expirado');
    });

    it('deve retornar status 403 (Acesso Negado) quando OPERADOR tentar acessar rota restrita de cancelamento', async () => {
        const resposta = await request(app)
            .patch('/api/entregas/1/cancelar') 
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${tokenOperadorValido}`);

        expect(resposta.status).toBe(403);
        expect(resposta.body.message).toBe('Acesso negado');
    });

    it('deve permitir acesso (não retornar 403) quando um GESTOR tentar acessar a rota de cancelamento', async () => {
        const entrega = await prisma.entrega.create({
            data: { descricao: 'Carga Importante', origem: 'A', destino: 'B', status: 'CRIADA' }
        });

        const resposta = await request(app)
            .patch(`/api/entregas/${entrega.id}/cancelar`)
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${tokenGestorValido}`);

        expect(resposta.status).not.toBe(403);
        expect(resposta.status).toBe(200);
    });
});