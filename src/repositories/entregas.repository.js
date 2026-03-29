export class EntregasRepository{
    constructor(database){
        this.database = database;
    }

    async listarTodos(){
        return this.database.getEntregas();        
    }

    async listarPorStatus(status) {
        const entregas = this.database.getEntregas();
        return entregas.filter(e => e.status === status);
    }

    async verificarDuplicidadeAtiva(descricao, origem, destino) {
        const entregas = this.database.getEntregas();
        const statusAtivos = ['CRIADA', 'EM_TRANSITO'];
        
        return entregas.some(e => 
            e.descricao === descricao &&
            e.origem === origem &&
            e.destino === destino &&
            statusAtivos.includes(e.status)
        );
    }

    async criar(dados){
        const novaEntrega = {
            id: this.database.generateIdEntregas(),
            descricao: dados.descricao,
            origem: dados.origem,
            destino: dados.destino,
            status: dados.status,
            historico: dados.historico
        };
        this.database.setEntregas(novaEntrega);
        return novaEntrega;
    }

    async buscarPorId(id){
        return this.database.getEntregas().find((x)=> x.id === id) ?? null;
    }

    async atualizarEntrega(id, dadosAtualizados){
        return this.database.atualizar(id, dadosAtualizados);
    }

    async atualizar(id, dadosAtualizados){
        return this.atualizarEntrega(id, dadosAtualizados);
    }
}