export class MotoristasRepository{
    constructor(database){
        this.database = database;
    }

    async listarTodos(){
        return this.database.getMotoristas();
    }

    async listarPorStatus(status){
        const motoristas = this.database.getMotoristas();
        return motoristas.filter(e => e.status === status);
    }
    
    async buscarPorId(id){
        return this.database.getMotoristas().find((x) => x.id == id) ?? null;
    }

    async buscarPorCpf(cpf){
        return this.database.getMotoristas().find((x) => x.cpf == cpf) ?? null;
    }

    async buscarPorCPF(cpf){
        return this.buscarPorCpf(cpf);
    }

    async criar(dados){
        const novoMotorista = {
            id: this.database.generateIdMotoristas(),
            nome: dados.nome,
            placaVeiculo: dados.placaVeiculo,
            cpf: dados.cpf,
            status: "ATIVO"
        }
        this.database.setMotoristas(novoMotorista);
        return novoMotorista;
    }

    async atualizar(id, dados){
        return this.database.atualizarMotorista(id,dados);
    }
}