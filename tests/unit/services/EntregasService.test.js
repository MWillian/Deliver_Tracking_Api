import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EntregasService } from '../../../src/services/entregas.services.js';
import { AppError } from '../../../src/utils/AppError.js';

function criarEntregasRepoFalso(overrides = {}) {
    return {
        verificarDuplicidadeAtiva: jest.fn().mockResolvedValue(false),
        criar: jest.fn(),
        buscarPorId: jest.fn(),
        atualizar: jest.fn(),
        ...overrides,
    };
}

function criarMotoristasRepoFalso(overrides = {}) {
    return {
        buscarPorId: jest.fn(),
        ...overrides,
    };
}

describe('EntregasService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('criar', () => {
        it('deve lançar AppError com status 400 quando origem for igual ao destino', async () => {
            const repo = criarEntregasRepoFalso();
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            const dadosInvalidos = { descricao: 'Pacote A', origem: 'Centro', destino: 'Centro' };

            await expect(service.criar(dadosInvalidos))
                .rejects
                .toMatchObject({ statusCode: 400, message: 'Origem e destino não podem ser iguais' });

            expect(repo.criar).not.toHaveBeenCalled();
        });

        it('deve lançar AppError com status 409 quando houver entrega duplicada em aberto', async () => {
            const repo = criarEntregasRepoFalso({
                verificarDuplicidadeAtiva: jest.fn().mockResolvedValue(true)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            const dados = { descricao: 'Pacote A', origem: 'Centro', destino: 'Bairro' };

            await expect(service.criar(dados))
                .rejects
                .toMatchObject({ statusCode: 409 });

            expect(repo.verificarDuplicidadeAtiva).toHaveBeenCalledWith('Pacote A', 'Centro', 'Bairro');
            expect(repo.criar).not.toHaveBeenCalled();
        });
    });

    describe('atualizarStatus & avancarStatus', () => {
        it('deve retornar entrega atualizada quando a transição for de CRIADA para EM_TRANSITO', async () => {
            const entregaCriada = { id: 1, status: 'CRIADA', historico: [] };
            const entregaAtualizada = { id: 1, status: 'EM_TRANSITO' };

            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaCriada),
                atualizar: jest.fn().mockResolvedValue(entregaAtualizada)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            const resultado = await service.avancarStatus(1);

            expect(resultado).toEqual(entregaAtualizada);
            expect(repo.atualizar).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'EM_TRANSITO' }));
        });

        it('deve retornar entrega com status ENTREGUE e dataEntrega preenchida quando transição for EM_TRANSITO para ENTREGUE', async () => {
            const entregaEmTransito = { id: 1, status: 'EM_TRANSITO', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaEmTransito),
                atualizar: jest.fn().mockImplementation((id, dados) => Promise.resolve(dados)) 
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            const resultado = await service.avancarStatus(1);

            expect(resultado.status).toBe('ENTREGUE');
            expect(resultado).toHaveProperty('dataEntrega'); 
            expect(repo.atualizar).toHaveBeenCalledTimes(1);
        });

        it('deve lançar AppError com status 422 quando a transição for de ENTREGUE para EM_TRANSITO (inválida)', async () => {
            const entregaEntregue = { id: 1, status: 'ENTREGUE', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaEntregue)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            await expect(service.atualizarStatus(1, 'EM_TRANSITO'))
                .rejects
                .toMatchObject({ statusCode: 422 });

            expect(repo.atualizar).not.toHaveBeenCalled();
        });

        it('deve lançar AppError com status 422 quando a transição for de CRIADA para ENTREGUE diretamente (inválida)', async () => {
            const entregaCriada = { id: 1, status: 'CRIADA', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaCriada)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            await expect(service.atualizarStatus(1, 'ENTREGUE'))
                .rejects
                .toMatchObject({ statusCode: 422 });
        });
    });

    describe('cancelarEntrega', () => {
        it('deve cancelar com sucesso uma entrega com status CRIADA', async () => {
            const entregaCriada = { id: 1, status: 'CRIADA', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaCriada),
                atualizar: jest.fn().mockImplementation((id, dados) => Promise.resolve(dados))
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            const resultado = await service.cancelarEntrega(1);

            expect(resultado.status).toBe('CANCELADA');
            expect(repo.atualizar).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'CANCELADA' }));
        });

        it('deve lançar AppError com status 422 quando tentar cancelar entrega com status ENTREGUE', async () => {
            const entregaEntregue = { id: 1, status: 'ENTREGUE', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaEntregue)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            await expect(service.cancelarEntrega(1))
                .rejects
                .toMatchObject({ statusCode: 422 });

            expect(repo.atualizar).not.toHaveBeenCalled();
        });
    });
});