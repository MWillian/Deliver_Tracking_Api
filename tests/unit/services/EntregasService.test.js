import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EntregasService } from '../../../src/services/entregas.services.js';
import { AppError } from '../../../src/utils/AppError.js';

// Factory para criar um repositório falso de entregas
function criarEntregasRepoFalso(overrides = {}) {
    return {
        verificarDuplicidadeAtiva: jest.fn().mockResolvedValue(false),
        criar: jest.fn(),
        buscarPorId: jest.fn(),
        atualizar: jest.fn(),
        ...overrides,
    };
}

// Factory para criar um repositório falso de motoristas
function criarMotoristasRepoFalso(overrides = {}) {
    return {
        buscarPorId: jest.fn(),
        ...overrides,
    };
}

describe('EntregasService', () => {

    // Limpa os mocks antes de cada teste para garantir isolamento
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('criar', () => {
        it('deve lançar AppError com status 400 quando origem for igual ao destino', async () => {
            // Arrange
            const repo = criarEntregasRepoFalso();
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            const dadosInvalidos = { descricao: 'Pacote A', origem: 'Centro', destino: 'Centro' };

            // Act & Assert
            await expect(service.criar(dadosInvalidos))
                .rejects
                .toMatchObject({ statusCode: 400, message: 'Origem e destino não podem ser iguais' });

            // Verifica que o banco nunca foi chamado
            expect(repo.criar).not.toHaveBeenCalled();
        });

        it('deve lançar AppError com status 409 quando houver entrega duplicada em aberto', async () => {
            // Arrange
            const repo = criarEntregasRepoFalso({
                // Simula que o repositório encontrou uma duplicidade
                verificarDuplicidadeAtiva: jest.fn().mockResolvedValue(true)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            const dados = { descricao: 'Pacote A', origem: 'Centro', destino: 'Bairro' };

            // Act & Assert
            await expect(service.criar(dados))
                .rejects
                .toMatchObject({ statusCode: 409 });

            expect(repo.verificarDuplicidadeAtiva).toHaveBeenCalledWith('Pacote A', 'Centro', 'Bairro');
            expect(repo.criar).not.toHaveBeenCalled();
        });
    });

    describe('atualizarStatus & avancarStatus', () => {
        it('deve retornar entrega atualizada quando a transição for de CRIADA para EM_TRANSITO', async () => {
            // Arrange
            const entregaCriada = { id: 1, status: 'CRIADA', historico: [] };
            const entregaAtualizada = { id: 1, status: 'EM_TRANSITO' };

            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaCriada),
                atualizar: jest.fn().mockResolvedValue(entregaAtualizada)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            // Act
            const resultado = await service.avancarStatus(1);

            // Assert
            expect(resultado).toEqual(entregaAtualizada);
            expect(repo.atualizar).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'EM_TRANSITO' }));
        });

        it('deve retornar entrega com status ENTREGUE e dataEntrega preenchida quando transição for EM_TRANSITO para ENTREGUE', async () => {
            // Arrange
            const entregaEmTransito = { id: 1, status: 'EM_TRANSITO', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaEmTransito),
                atualizar: jest.fn().mockImplementation((id, dados) => Promise.resolve(dados)) // Retorna o que foi salvo
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            // Act
            const resultado = await service.avancarStatus(1);

            // Assert
            expect(resultado.status).toBe('ENTREGUE');
            expect(resultado).toHaveProperty('dataEntrega'); // Verifica a inserção da data
            expect(repo.atualizar).toHaveBeenCalledTimes(1);
        });

        it('deve lançar AppError com status 422 quando a transição for de ENTREGUE para EM_TRANSITO (inválida)', async () => {
            // Arrange
            const entregaEntregue = { id: 1, status: 'ENTREGUE', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaEntregue)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            // Act & Assert
            await expect(service.atualizarStatus(1, 'EM_TRANSITO'))
                .rejects
                .toMatchObject({ statusCode: 422 });

            expect(repo.atualizar).not.toHaveBeenCalled();
        });

        it('deve lançar AppError com status 422 quando a transição for de CRIADA para ENTREGUE diretamente (inválida)', async () => {
            // Arrange
            const entregaCriada = { id: 1, status: 'CRIADA', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaCriada)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            // Act & Assert
            await expect(service.atualizarStatus(1, 'ENTREGUE'))
                .rejects
                .toMatchObject({ statusCode: 422 });
        });
    });

    describe('cancelarEntrega', () => {
        it('deve cancelar com sucesso uma entrega com status CRIADA', async () => {
            // Arrange
            const entregaCriada = { id: 1, status: 'CRIADA', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaCriada),
                atualizar: jest.fn().mockImplementation((id, dados) => Promise.resolve(dados))
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            // Act
            const resultado = await service.cancelarEntrega(1);

            // Assert
            expect(resultado.status).toBe('CANCELADA');
            expect(repo.atualizar).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'CANCELADA' }));
        });

        it('deve lançar AppError com status 422 quando tentar cancelar entrega com status ENTREGUE', async () => {
            // Arrange
            const entregaEntregue = { id: 1, status: 'ENTREGUE', historico: [] };
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue(entregaEntregue)
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            // Act & Assert
            await expect(service.cancelarEntrega(1))
                .rejects
                .toMatchObject({ statusCode: 422 });

            expect(repo.atualizar).not.toHaveBeenCalled();
        });
    });
});