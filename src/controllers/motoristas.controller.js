export class MotoristasController{
    constructor(service){
        this.service = service; 
        this.listarTodos = this.listarTodos.bind(this);
        this.listarPorId = this.listarPorId.bind(this);
        this.criar = this.criar.bind(this);
        this.listarEntregas = this.listarEntregas.bind(this);
    }

    async listarTodos(req, res, next){
        try {
            const { status } = req.query;
            let motoristas;
            if (status) {
                motoristas = await this.service.listarComFiltros(status);
            }else{
                motoristas = await this.service.listarTodos();
            };
            res.json(motoristas);
        } catch(err) {
            next(err);
        };
    };

    async listarPorId(req, res, next){
        try{
            const motorista = await this.service.listarPorId(Number(req.params.id));
            res.json(motorista);
        } catch (err){
            next(err);
        }
    }

    async criar(req,res,next){
        try {
            const novoMotorista = await this.service.criar(req.body);
            res.status(201).json(novoMotorista);
        } catch (err) {
            next(err);
        };
    };

    async listarEntregas(req,res,next){
        try {
            const {id} = req.params.id;
            const entregasDoMotorista = await this.service.listarEntregasPorIdMotorista(Number(id));
            res.json(entregasDoMotorista);
        } catch (err) {
            next(err);
        }
    }
};