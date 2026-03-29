import {AppError} from '../utils/AppError.js'

export class MotoristasService{
    constructor(repository){
        this.repository = repository;
    }

    async listarTodos(){
        return this.repository.listarTodos();
    }

    async listarComFiltros(status){
        const valoresValidos = ['CRIADA', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA'];
        if (!valoresValidos.includes(status)){
            throw new AppError(`Status inválido: ${status}`, 400);
        }
        return this.repository.listarPorStatus(status);
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
    
    // async listarEntregasPorIdMotorista(id){
    //     const listasEntregas = await this.repository.ListarEntregasPorId();
    // }


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
