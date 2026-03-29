import { AppError } from '../utils/AppError.js';

export class EntregasService{
    /**
     * @param {import('../repositories/IEntregas.repository.js').IEntregasRepository} entregasRepository
     * @param {import('../repositories/IMotoristas.repository.js').IMotoristasRepository} motoristaRepository
     */
    constructor(entregasRepository, motoristaRepository ){
        this.entregasRepository = entregasRepository;
        this.motoristaRepository = motoristaRepository;
    }

    async listarTodos(){
        return this.entregasRepository.listarTodos();
    }

    async listarPorStatus(status) {
        const valoresValidos = ['CRIADA', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA'];
        if (!valoresValidos.includes(status)) {
            throw new AppError(`Status inválido: ${status}`, 400);
        }
        return this.entregasRepository.listarPorStatus(status);
    }

    async criar(dados) {
        if (!dados.descricao || !dados.origem || !dados.destino) {
            throw new AppError('Descrição, origem e destino são obrigatórios', 400);
        }

        if (dados.origem === dados.destino) {
            throw new AppError('Origem e destino não podem ser iguais', 400);
        }

        const existeDuplicado = await this.entregasRepository.verificarDuplicidadeAtiva(
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

        return this.entregasRepository.criar(novaEntrega);
    }

    async buscarPorId(id){
        const entrega = await this.entregasRepository.buscarPorId(id);
        
        if (!entrega) {
            throw new AppError('Entrega não encontrada', 404);
        }

        return entrega;
    }

    async avancarStatus(id) {
        const entrega = await this.entregasRepository.buscarPorId(id);

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

        return await this.atualizarStatus(id, proximoStatus, 'Status avançado');
    }

    async cancelarEntrega(id) {
        const entrega = await this.entregasRepository.buscarPorId(id);

        if (entrega.status === 'ENTREGUE' || entrega.status === 'CANCELADA') {
            throw new AppError(`Não é permitido cancelar uma entrega que já foi ${entrega.status}`, 400);
        }

        return await this.atualizarStatus(id, 'CANCELADA', 'Entrega cancelada');
    }

    async atualizarStatus(id, novoStatus, descricaoEvento) {
        const agora = new Date();
        const dataFormatada = `${agora.getDate()}/${agora.getMonth() + 1}/${agora.getFullYear()}`;
        
        const novoEvento = {
            data: dataFormatada,
            descricao: novoStatus
        };

        const entrega = await this.entregasRepository.buscarPorId(id);
        const historicoAtualizado = [...entrega.historico, novoEvento];

        return await this.entregasRepository.atualizar(id, {
            status: novoStatus,
            historico: historicoAtualizado
        });
    }

    async obterHistorico(id) {
        const entrega = await this.entregasRepository.buscarPorId(id);
        return entrega.historico;
    }

    async atribuirEntrega(motoristaId,idEntrega){
        const entrega = await this.entregasRepository.buscarPorId(idEntrega);
        if (!entrega) {
            throw new AppError('Entrega não encontrada.',404);
        }

        const motorista = await this.motoristaRepository.buscarPorId(motoristaId);

        if (!motorista) {
            throw new AppError('Motorista não encontrado.',404);
        }
        
        if (entrega.status != "CRIADA") {
            throw new AppError('Só é possível atribuir um motorista para uma entrega recém criada.',422);
        }

        if (motorista.status != "ATIVO") {
            throw new AppError('Motorista inativo.',422);
        }

        const historico = Array.isArray(entrega.historico) ? entrega.historico : [];
        const jaAtribuida = historico.some(evento => evento.motoristaId != null);
        if (!jaAtribuida) {
            const agora = new Date();
            const dataFormatada = `${agora.getDate()}/${agora.getMonth() + 1}/${agora.getFullYear()}`;
            entrega.historico.push({
                data: dataFormatada,
                motoristaId: motorista.id,
                descricao: `Atribuição de primeiro motorista: ${motorista.nome}.`
            });
            const entregaAtribuida = await this.entregasRepository.atualizar(idEntrega, entrega);
            return entregaAtribuida;
        }else{
            const agora = new Date();
            const dataFormatada = `${agora.getDate()}/${agora.getMonth() + 1}/${agora.getFullYear()}`;
            entrega.historico.push({
                motoristaId: motorista.id,
                data: dataFormatada,
                descricao: `Substituição de primeiro motorista: ${motorista.nome}.`
            });
            const entregaAtribuida = await this.entregasRepository.atualizar(idEntrega, entrega);
            return entregaAtribuida;
        }
    }


}