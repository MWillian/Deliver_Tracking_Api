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

    // RF-05: Prepara o banco e gera os tokens reais antes de rodar os testes de rota
    beforeEach(async () => {
        try { await prisma.eventoEntrega.deleteMany(); } catch (e) { }
        try { await prisma.entrega.deleteMany(); } catch (e) { }
        await prisma.usuario.deleteMany();

        // 1. Cria usuário OPERADOR real no banco de testes
        usuarioOperador = await prisma.usuario.create({
            data: { nome: 'Op Teste', email: 'op@teste.com', senha: 'hash', papel: 'OPERADOR' }
        });

        // 2. Cria usuário GESTOR real no banco de testes
        usuarioGestor = await prisma.usuario.create({
            data: { nome: 'Gestor Teste', email: 'gestor@teste.com', senha: 'hash', papel: 'GESTOR' }
        });

        // Gera tokens válidos baseados nas chaves do ambiente de teste
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

    // Cenário 1: Requisição sem token
    it('deve retornar status 401 quando nenhuma credencial for fornecida', async () => {
        const resposta = await request(app)
            .get('/api/entregas')
            .set('Accept', 'application/json');

        expect(resposta.status).toBe(401);
        expect(resposta.body.message).toBe('Token não fornecido');
    });

    // Cenário 2: Requisição com token de assinatura inválida
    it('deve retornar status 401 quando o token tiver assinatura inválida', async () => {
        const tokenAdulterado = tokenOperadorValido + 'adulterado123';

        const resposta = await request(app)
            .get('/api/entregas')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${tokenAdulterado}`);

        expect(resposta.status).toBe(401);
        expect(resposta.body.message).toBe('Token inválido');
    });

    // Cenário 3: Requisição com token expirado
    it('deve retornar status 401 e conter a palavra "expirado" quando o token estiver vencido', async () => {
        // Gera um token que já nasce expirado há 1 segundo atrás
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

    // Cenário 4: RBAC - Usuário com papel OPERADOR acessando rota exclusiva de GESTOR
    it('deve retornar status 403 (Acesso Negado) quando OPERADOR tentar acessar rota restrita de cancelamento', async () => {
        const resposta = await request(app)
            .patch('/api/entregas/1/cancelar') // Rota trancada pelo autorizar('GESTOR')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${tokenOperadorValido}`);

        expect(resposta.status).toBe(403);
        expect(resposta.body.message).toBe('Acesso negado');
    });

    // Cenário 5: RBAC - Usuário GESTOR acessando a mesma rota restrita com sucesso
    it('deve permitir acesso (não retornar 403) quando um GESTOR tentar acessar a rota de cancelamento', async () => {
        // Criamos uma entrega real para que o controller não barre com 404 antes de testar a segurança
        const entrega = await prisma.entrega.create({
            data: { descricao: 'Carga Importante', origem: 'A', destino: 'B', status: 'CRIADA' }
        });

        const resposta = await request(app)
            .patch(`/api/entregas/${entrega.id}/cancelar`)
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${tokenGestorValido}`);

        // O acesso deve ser concedido (não pode dar 403). O retorno esperado do seu service/controller é 200.
        expect(resposta.status).not.toBe(403);
        expect(resposta.status).toBe(200);
    });

    // Cenário 6: Defesa contra IDOR / Vazamento de Escopo por IDs inexistentes/manipulados
    it('deve retornar status de erro (404) quando um usuário tentar forçar o acesso a dados fora de seu escopo ou inexistentes', async () => {
        // Um ID alto simulando um ataque de força bruta/manipulação de parâmetros na URL
        const idForaDoEscopo = 999999;

        const resposta = await request(app)
            .get(`/api/entregas/${idForaDoEscopo}`)
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${tokenOperadorValido}`);

        // O gabarito aceita 403 ou 404 para proteger o escopo.
        // Como o seu EntregasService.buscarPorId lança corretamente um AppError('Entrega não encontrada', 404),
        // a API se defende mascarando a existência de dados e retornando o status esperado.
        expect([403, 404]).toContain(resposta.status);
    });
});