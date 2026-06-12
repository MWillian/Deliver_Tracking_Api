import { jest } from '@jest/globals';
import { MotoristasService } from '../../../src/services/motoristas.service.js';
import { AppError } from '../../../src/utils/AppError.js';

describe('Testes Unitários: MotoristasService', () => {
    let service;
    let motoristasRepoMock;
    let entregasRepoMock;

    beforeEach(() => {
        motoristasRepoMock = {
            listarTodos: jest.fn(),
            buscarPorId: jest.fn(),
            criar: jest.fn(),
            atualizar: jest.fn(),
        };

        entregasRepoMock = {
            listarTodos: jest.fn(),
        };

        service = new MotoristasService(motoristasRepoMock, entregasRepoMock);
    });

    describe('listarTodos', () => {
        it('deve retornar a lista completa de motoristas', async () => {
            const mockData = [{ id: 1, nome: 'João' }];
            motoristasRepoMock.listarTodos.mockResolvedValue(mockData);

            const resultado = await service.listarTodos();

            expect(resultado).toEqual(mockData);
            expect(motoristasRepoMock.listarTodos).toHaveBeenCalledTimes(1);
        });
    });

    describe('listarComFiltros', () => {
        it('deve retornar apenas motoristas com o status solicitado', async () => {
            motoristasRepoMock.listarTodos.mockResolvedValue([
                { id: 1, status: 'ATIVO' },
                { id: 2, status: 'INATIVO' }
            ]);

            const resultado = await service.listarComFiltros('ATIVO');

            expect(resultado).toHaveLength(1);
            expect(resultado[0].status).toBe('ATIVO');
        });

        it('deve lançar AppError 400 se o status for inválido', async () => {
            await expect(service.listarComFiltros('FERIAS'))
                .rejects
                .toMatchObject({ statusCode: 400, message: 'Status inválido: FERIAS' });
        });
    });

    describe('listarPorId', () => {
        it('deve retornar o motorista se o ID existir', async () => {
            const mockMotorista = { id: 1, nome: 'Maria' };
            motoristasRepoMock.buscarPorId.mockResolvedValue(mockMotorista);

            const resultado = await service.listarPorId(1);

            expect(resultado).toEqual(mockMotorista);
        });

        it('deve lançar AppError 404 se o motorista não for encontrado', async () => {
            motoristasRepoMock.buscarPorId.mockResolvedValue(null);

            await expect(service.listarPorId(999))
                .rejects
                .toMatchObject({ statusCode: 404, message: 'Motorista não encontrado' });
        });
    });

    describe('validarCpf', () => {
        it('deve limpar a formatação e retornar apenas os números', () => {
            const cpfLimpo = service.validarCpf('123.456.789-10');
            expect(cpfLimpo).toBe('12345678910');
        });

        it('deve lançar AppError 400 se o CPF contiver letras', () => {
            expect(() => service.validarCpf('123.456.789-AA'))
                .toThrow(expect.objectContaining({ statusCode: 400, message: 'CPF não pode conter letras.' }));
        });

        it('deve lançar AppError 400 se o CPF contiver caracteres especiais inválidos', () => {
            expect(() => service.validarCpf('1234567891@'))
                .toThrow(expect.objectContaining({ statusCode: 400, message: 'CPF deve conter apenas números.' }));
        });

        it('deve lançar AppError 400 se o tamanho do CPF for diferente de 11', () => {
            expect(() => service.validarCpf('123456'))
                .toThrow(expect.objectContaining({ statusCode: 400, message: 'CPF deve ter exatamente 11 dígitos.' }));
        });
    });

    describe('criar', () => {
        const dadosValidos = { nome: 'Carlos', cpf: '111.222.333-44', placaVeiculo: 'ABC-1234' };

        it('deve criar um motorista com sucesso', async () => {
            motoristasRepoMock.listarTodos.mockResolvedValue([]); 
            motoristasRepoMock.criar.mockResolvedValue({ id: 1, ...dadosValidos, cpf: '11122233344' });

            const resultado = await service.criar({ ...dadosValidos });

            expect(resultado).toHaveProperty('id');
            expect(resultado.cpf).toBe('11122233344'); 
        });

        it('deve lançar AppError 400 se faltarem campos obrigatórios', async () => {
            await expect(service.criar({ nome: 'Carlos' }))
                .rejects
                .toMatchObject({ statusCode: 400, message: 'Nome, CPF, e placa do veículo do motorista são obrigatórios.' });
        });

        it('deve lançar AppError 400 se o nome for muito curto', async () => {
            await expect(service.criar({ nome: 'A', cpf: '11122233344', placaVeiculo: 'ABC-1234' }))
                .rejects
                .toMatchObject({ statusCode: 400, message: 'Nome do motorista deve ter no mínimo 2 caracteres.' });
        });

        it('deve lançar AppError 409 se o CPF já estiver cadastrado', async () => {
            motoristasRepoMock.listarTodos.mockResolvedValue([{ cpf: '11122233344' }]);

            await expect(service.criar({ ...dadosValidos }))
                .rejects
                .toMatchObject({ statusCode: 409, message: 'Cpf já cadastrado.' });
        });
    });

    describe('inativar', () => {
        it('deve alterar o status do motorista para INATIVO', async () => {
            const motoristaAtivo = { id: 1, status: 'ATIVO' };
            motoristasRepoMock.buscarPorId.mockResolvedValue(motoristaAtivo);
            motoristasRepoMock.atualizar.mockResolvedValue({ ...motoristaAtivo, status: 'INATIVO' });

            const resultado = await service.inativar(1);

            expect(resultado.status).toBe('INATIVO');
            expect(motoristasRepoMock.atualizar).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'INATIVO' }));
        });

        it('deve lançar AppError 422 se o motorista já estiver INATIVO', async () => {
            motoristasRepoMock.buscarPorId.mockResolvedValue({ id: 1, status: 'INATIVO' });

            await expect(service.inativar(1))
                .rejects
                .toMatchObject({ statusCode: 422, message: 'Só é possível desativar um motorista ativo.' });
        });
    });

    describe('listarEntregasPorId', () => {
        const mockEntregas = [
            { id: 10, status: 'CRIADA', historico: [{ motoristaId: 1 }] },
            { id: 20, status: 'ENTREGUE', historico: [{ motoristaId: 1 }] },
            { id: 30, status: 'CRIADA', historico: [{ motoristaId: 2 }] }, 
        ];

        it('deve listar todas as entregas do motorista se nenhum filtro for passado', async () => {
            entregasRepoMock.listarTodos.mockResolvedValue(mockEntregas);

            const resultado = await service.listarEntregasPorId(1);

            expect(resultado).toHaveLength(2);
            expect(resultado.map(e => e.id)).toEqual([10, 20]);
        });

        it('deve filtrar as entregas do motorista pelo status fornecido', async () => {
            entregasRepoMock.listarTodos.mockResolvedValue(mockEntregas);

            const resultado = await service.listarEntregasPorId(1, { status: 'ENTREGUE' });

            expect(resultado).toHaveLength(1);
            expect(resultado[0].id).toBe(20);
        });

        it('deve lançar AppError 400 se o filtro de status for inválido', async () => {
            await expect(service.listarEntregasPorId(1, { status: 'INVALIDO' }))
                .rejects
                .toMatchObject({ statusCode: 400, message: 'Filtro de busca inválido' });
        });
    });
});