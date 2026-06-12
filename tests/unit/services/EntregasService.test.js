import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EntregasService } from '../../../src/services/entregas.services.js';
import { AppError } from '../../../src/utils/AppError.js';

function criarEntregasRepoFalso(overrides = {}) {
    return {
        listarTodos: jest.fn(),
        listarPorStatus: jest.fn(),
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

describe('Testes Unitários: EntregasService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('listarTodos e listarPorStatus', () => {
        it('deve retornar a lista completa de entregas', async () => {
            const repo = criarEntregasRepoFalso({ listarTodos: jest.fn().mockResolvedValue([{ id: 1 }]) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            
            const resultado = await service.listarTodos();
            expect(resultado).toHaveLength(1);
            expect(repo.listarTodos).toHaveBeenCalled();
        });

        it('deve listar entregas filtradas por um status válido', async () => {
            const repo = criarEntregasRepoFalso({ listarPorStatus: jest.fn().mockResolvedValue([{ id: 1, status: 'CRIADA' }]) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            
            const resultado = await service.listarPorStatus('CRIADA');
            expect(resultado[0].status).toBe('CRIADA');
            expect(repo.listarPorStatus).toHaveBeenCalledWith('CRIADA');
        });

        it('deve lançar AppError 400 se tentar buscar por um status inválido', async () => {
            const service = new EntregasService(criarEntregasRepoFalso(), criarMotoristasRepoFalso());
            await expect(service.listarPorStatus('INVALIDO'))
                .rejects.toMatchObject({ statusCode: 400, message: 'Status inválido: INVALIDO' });
        });
    });

    describe('buscarPorId e obterHistorico', () => {
        it('deve retornar uma entrega pelo ID', async () => {
            const repo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, descricao: 'A' }) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            
            const resultado = await service.buscarPorId(1);
            expect(resultado.id).toBe(1);
        });

        it('deve lançar AppError 404 se a entrega não for encontrada', async () => {
            const repo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue(null) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            
            await expect(service.buscarPorId(999)).rejects.toMatchObject({ statusCode: 404, message: 'Entrega não encontrada' });
        });

        it('deve retornar apenas o histórico da entrega solicitada', async () => {
            const mockHistorico = [{ descricao: 'CRIADA' }];
            const repo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, historico: mockHistorico }) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            
            const resultado = await service.obterHistorico(1);
            expect(resultado).toEqual(mockHistorico);
        });
    });

    describe('criar', () => {
        it('deve lançar AppError 400 se faltarem dados obrigatórios', async () => {
            const service = new EntregasService(criarEntregasRepoFalso(), criarMotoristasRepoFalso());
            await expect(service.criar({ descricao: 'A' })) // Sem origem e destino
                .rejects.toMatchObject({ statusCode: 400, message: 'Descrição, origem e destino são obrigatórios' });
        });

        it('deve lançar AppError 400 quando origem for igual ao destino', async () => {
            const service = new EntregasService(criarEntregasRepoFalso(), criarMotoristasRepoFalso());
            await expect(service.criar({ descricao: 'A', origem: 'X', destino: 'X' }))
                .rejects.toMatchObject({ statusCode: 400, message: 'Origem e destino não podem ser iguais' });
        });

        it('deve lançar AppError 409 quando houver entrega duplicada', async () => {
            const repo = criarEntregasRepoFalso({ verificarDuplicidadeAtiva: jest.fn().mockResolvedValue(true) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            await expect(service.criar({ descricao: 'A', origem: 'X', destino: 'Y' }))
                .rejects.toMatchObject({ statusCode: 409, message: 'Já existe uma entrega ativa com essas características' });
        });

        it('deve criar entrega com sucesso formatando o histórico inicial', async () => {
            const repo = criarEntregasRepoFalso({ criar: jest.fn().mockImplementation(dados => Promise.resolve({ id: 1, ...dados })) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            
            const resultado = await service.criar({ descricao: 'Pacote', origem: 'A', destino: 'B', criadorId: 10 });
            
            expect(resultado.status).toBe('CRIADA');
            expect(resultado.historico).toHaveLength(1);
            expect(resultado.historico[0].descricao).toBe('CRIADA');
            expect(repo.criar).toHaveBeenCalledTimes(1);
        });
    });

    describe('atualizarStatus & avancarStatus', () => {
        it('deve avançar de CRIADA para EM_TRANSITO', async () => {
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'CRIADA', historico: [] }),
                atualizar: jest.fn().mockResolvedValue({ id: 1, status: 'EM_TRANSITO' })
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            
            const resultado = await service.avancarStatus(1);
            expect(resultado.status).toBe('EM_TRANSITO');
        });

        it('deve preencher a dataEntrega ao avançar de EM_TRANSITO para ENTREGUE', async () => {
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'EM_TRANSITO', historico: [] }),
                atualizar: jest.fn().mockImplementation((id, dados) => Promise.resolve(dados)) 
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            const resultado = await service.avancarStatus(1);
            expect(resultado.status).toBe('ENTREGUE');
            expect(resultado).toHaveProperty('dataEntrega'); 
        });

        it('deve lançar AppError 400 se tentar avançar o status de uma entrega ENTREGUE ou CANCELADA', async () => {
            const repo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'CANCELADA', historico: [] }) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());
            
            await expect(service.avancarStatus(1))
                .rejects.toMatchObject({ statusCode: 400, message: 'Não é permitido avançar o status de uma entrega CANCELADA' });
        });

        it('deve lançar AppError 422 ao tentar voltar status de ENTREGUE para EM_TRANSITO', async () => {
            const repo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'ENTREGUE', historico: [] }) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            await expect(service.atualizarStatus(1, 'EM_TRANSITO')).rejects.toMatchObject({ statusCode: 422 });
        });

        it('deve lançar AppError 422 ao pular de CRIADA para ENTREGUE', async () => {
            const repo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'CRIADA', historico: [] }) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            await expect(service.atualizarStatus(1, 'ENTREGUE')).rejects.toMatchObject({ statusCode: 422 });
        });
    });

    describe('cancelarEntrega', () => {
        it('deve cancelar com sucesso uma entrega com status CRIADA', async () => {
            const repo = criarEntregasRepoFalso({
                buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'CRIADA', historico: [] }),
                atualizar: jest.fn().mockImplementation((id, dados) => Promise.resolve(dados))
            });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            const resultado = await service.cancelarEntrega(1);
            expect(resultado.status).toBe('CANCELADA');
        });

        it('deve lançar AppError 422 quando tentar cancelar entrega com status ENTREGUE', async () => {
            const repo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'ENTREGUE', historico: [] }) });
            const service = new EntregasService(repo, criarMotoristasRepoFalso());

            await expect(service.cancelarEntrega(1)).rejects.toMatchObject({ statusCode: 422 });
        });
    });

    describe('atribuirEntrega', () => {
        it('deve lançar AppError 404 se a entrega não existir', async () => {
            const entregasRepo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue(null) });
            const service = new EntregasService(entregasRepo, criarMotoristasRepoFalso());
            
            await expect(service.atribuirEntrega(1, 1)).rejects.toMatchObject({ statusCode: 404, message: 'Entrega não encontrada.' });
        });

        it('deve lançar AppError 404 se o motorista não existir', async () => {
            const entregasRepo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1 }) });
            const motoristasRepo = criarMotoristasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue(null) });
            const service = new EntregasService(entregasRepo, motoristasRepo);
            
            await expect(service.atribuirEntrega(1, 1)).rejects.toMatchObject({ statusCode: 404, message: 'Motorista não encontrado.' });
        });

        it('deve lançar AppError 422 se a entrega não estiver com status CRIADA', async () => {
            const entregasRepo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'EM_TRANSITO' }) });
            const motoristasRepo = criarMotoristasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'ATIVO' }) });
            const service = new EntregasService(entregasRepo, motoristasRepo);
            
            await expect(service.atribuirEntrega(1, 1)).rejects.toMatchObject({ statusCode: 422, message: 'Só é possível atribuir um motorista para uma entrega recém criada.' });
        });

        it('deve lançar AppError 422 se o motorista estiver inativo', async () => {
            const entregasRepo = criarEntregasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'CRIADA' }) });
            const motoristasRepo = criarMotoristasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 1, status: 'INATIVO' }) });
            const service = new EntregasService(entregasRepo, motoristasRepo);
            
            await expect(service.atribuirEntrega(1, 1)).rejects.toMatchObject({ statusCode: 422, message: 'Motorista inativo.' });
        });

        it('deve atribuir o motorista pela PRIMEIRA vez e registrar no histórico', async () => {
            const entregaOriginal = { id: 1, status: 'CRIADA', historico: [{ descricao: 'CRIADA' }] };
            const entregasRepo = criarEntregasRepoFalso({ 
                buscarPorId: jest.fn().mockResolvedValue(entregaOriginal),
                atualizar: jest.fn().mockImplementation((id, dados) => Promise.resolve(dados))
            });
            const motoristasRepo = criarMotoristasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 2, nome: 'Pedro', status: 'ATIVO' }) });
            const service = new EntregasService(entregasRepo, motoristasRepo);
            
            const resultado = await service.atribuirEntrega(2, 1);
            
            const ultimoEvento = resultado.historico[resultado.historico.length - 1];
            expect(ultimoEvento.motoristaId).toBe(2);
            expect(ultimoEvento.descricao).toContain('Atribuição de primeiro motorista');
        });

        it('deve SUBSTITUIR o motorista e registrar no histórico se já houver um atribuído', async () => {
            const entregaOriginal = { 
                id: 1, status: 'CRIADA', 
                historico: [{ descricao: 'CRIADA' }, { motoristaId: 2, descricao: 'Atribuição' }] // Já tem motorista 2
            };
            const entregasRepo = criarEntregasRepoFalso({ 
                buscarPorId: jest.fn().mockResolvedValue(entregaOriginal),
                atualizar: jest.fn().mockImplementation((id, dados) => Promise.resolve(dados))
            });
            const motoristasRepo = criarMotoristasRepoFalso({ buscarPorId: jest.fn().mockResolvedValue({ id: 3, nome: 'Lucas', status: 'ATIVO' }) });
            const service = new EntregasService(entregasRepo, motoristasRepo);
            
            const resultado = await service.atribuirEntrega(3, 1); // Substituindo pelo 3
            
            const ultimoEvento = resultado.historico[resultado.historico.length - 1];
            expect(ultimoEvento.motoristaId).toBe(3);
            expect(ultimoEvento.descricao).toContain('Substituição de primeiro motorista');
        });
    });
});