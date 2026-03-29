import {AppError} from '../utils/AppError.js'

export class MotoristasService{
    /**
     * @param {import('../repositories/IMotoristas.repository.js').IMotoristasRepository} repository
     * @param {import('../repositories/IEntregas.repository.js').IEntregasRepository} entregasRepository
     */
    constructor(repository,entregasRepository){
        this.repository = repository;
        this.entregasRepository = entregasRepository;
    }

    async listarTodos(){
        return this.repository.listarTodos();
    }

    async listarComFiltros(status){
        const valoresValidos = ['CRIADA', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA'];
        if (!valoresValidos.includes(status)){
            throw new AppError(`Status inválido: ${status}`, 400);
        }
        const motoristas = await this.repository.listarTodos();
        return motoristas.filter(motorista => motorista.status === status);
    }

    async listarPorId(id){
        const motorista = await this.repository.buscarPorId(id);
        if (!motorista) {
            throw new AppError(`Motorista não encontrado`, 404);
        }
        return motorista;
    }

    async criar(dados){
        if (!dados.nome || !dados.cpf || !dados.placaVeiculo) {
            throw new AppError(`Nome, CPF, e placa do veículo do motorista são obrigatórios.`, 400);
        }
        if (dados.nome.length < 2) {
            throw new AppError(`Nome do motorista deve ter no mínimo 2 caracteres.`, 400);
        }

        const cpf = this.validarCpf(dados.cpf);
        dados.cpf = cpf;
        const motoristas = await this.repository.listarTodos();
        motoristas.forEach(motorista => {
          if (motorista.cpf === cpf) {
            throw new AppError(`Cpf já cadastrado.`, 409);
          }  
        });
        const novoMotorista = await this.repository.criar(dados);
        return novoMotorista;
    }

    async inativar(id){
        const motorista = await this.listarPorId(id);
        if (motorista.status != "ATIVO") {
            throw new AppError(`Só é possível desativar um motorista ativo.`, 422);
        }
        motorista.status = "INATIVO";
        return await this.repository.atualizar(id,motorista);
    }
    
    async listarEntregasPorId(id, filtros){
        const statusEntregaValidos = ['CRIADA', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA'];
        const statusFiltro = filtros?.status ? String(filtros.status).toUpperCase() : null;
        if (statusFiltro && !statusEntregaValidos.includes(statusFiltro)) {
            throw new AppError(`Filtro de busca inválido`, 400);
        }
        
        const entregas = await this.entregasRepository.listarTodos();
        let listaEntregas = [];
        entregas.forEach(entrega => {
            const historico = Array.isArray(entrega.historico) ? entrega.historico : [];
            const temMotorista = historico.some(evento => evento.motoristaId === id);
            const statusOk = !statusFiltro || entrega.status === statusFiltro;
            if (temMotorista && statusOk) {
                listaEntregas.push(entrega);
            }
        });
        return listaEntregas;
    }
    
    // MÉTODOS AUXILIARES
    validarCpf(cpf){
        const cleanedCpf = cpf.replace(/\./g, '').replace(/-/g, '');

        if (/[a-zA-Z]/.test(cleanedCpf)) {
            throw new AppError(`CPF não pode conter letras.`, 400);
        }

        if (!/^\d+$/.test(cleanedCpf)) {
            throw new AppError(`CPF deve conter apenas números.`, 400);
        }

        if (cleanedCpf.length !== 11) {
            throw new AppError(`CPF deve ter exatamente 11 dígitos.`, 400);
        }
        return cleanedCpf;
    }
}
