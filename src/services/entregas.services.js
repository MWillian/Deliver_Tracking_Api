import {AppError} from '../utils/AppError.js'

export class EntregasService{
    constructor(repository){
        this.repository = repository;
    }

    async listarTodos(){
        return this.repository.listarTodos();
    }

    async listarPorStatus(status) {
        const valoresValidos = ['CRIADA', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA'];
        if (!valoresValidos.includes(status)) {
            throw new AppError(`Status inválido: ${status}`, 400);
        }
        return this.repository.listarPorStatus(status);
    }

    async criar(dados) {
        if (!dados.descricao || !dados.origem || !dados.destino) {
            throw new AppError('Descrição, origem e destino são obrigatórios', 400);
        }

        if (dados.origem === dados.destino) {
            throw new AppError('Origem e destino não podem ser iguais', 400);
        }

        const existeDuplicado = await this.repository.verificarDuplicidadeAtiva(
            dados.descricao,
            dados.origem,
            dados.destino
        );

        if (existeDuplicado) {
            throw new AppError('Já existe uma entrega ativa com essas características', 400);
        }

        const agora = new Date();
        const dataFormatada = `${agora.getDate()}/${agora.getMonth() + 1}/${agora.getFullYear()}`;
        const historicoInicial = {
            data: dataFormatada,
            descricao: 'CRIADA'
        };

        const novaEntrega = {
            descricao: dados.descricao,
            origem: dados.origem,
            destino: dados.destino,
            status: 'CRIADA',
            historico: [historicoInicial]
        };

        return this.repository.criar(novaEntrega);
    }

    async buscarPorId(id){
        const entrega = await this.repository.buscarPorId(id);
        
        if (!entrega) {
            throw new AppError('Entrega não encontrada', 404);
        }

        return entrega;
    }

    async avancarStatus(id) {
        const entrega = await this.buscarPorId(id);

        const transicoes = {
            'CRIADA': 'EM_TRANSITO',
            'EM_TRANSITO': 'ENTREGUE',
            'ENTREGUE': null,
            'CANCELADA': null
        };

        const proximoStatus = transicoes[entrega.status];

        if (!proximoStatus) {
            throw new AppError(`Não é permitido avançar o status de uma entrega ${entrega.status}`, 400);
        }

        return await this._atualizarStatus(id, proximoStatus, 'Status avançado');
    }

    async cancelarEntrega(id) {
        const entrega = await this.buscarPorId(id);

        if (entrega.status === 'ENTREGUE' || entrega.status === 'CANCELADA') {
            throw new AppError(`Não é permitido cancelar uma entrega que já foi ${entrega.status}`, 400);
        }

        return await this._atualizarStatus(id, 'CANCELADA', 'Entrega cancelada');
    }

    async _atualizarStatus(id, novoStatus, descricaoEvento) {
        const agora = new Date();
        const dataFormatada = `${agora.getDate()}/${agora.getMonth() + 1}/${agora.getFullYear()}`;
        
        const novoEvento = {
            data: dataFormatada,
            descricao: novoStatus
        };

        const entrega = await this.repository.buscarPorId(id);
        const historicoAtualizado = [...entrega.historico, novoEvento];

        return await this.repository.atualizarEntrega(id, {
            status: novoStatus,
            historico: historicoAtualizado
        });
    }

    async obterHistorico(id) {
        const entrega = await this.buscarPorId(id);
        return entrega.historico;
    }
}