import { AppError } from '../utils/AppError.js';

export class EntregasController{
    constructor(service) {
        this.service = service; 
        this.listarTodos = this.listarTodos.bind(this);
        this.buscarPorId = this.buscarPorId.bind(this);
        this.criar = this.criar.bind(this);
        this.avancar = this.avancar.bind(this);
        this.cancelar = this.cancelar.bind(this);
        this.obterHistorico = this.obterHistorico.bind(this);
        this.atribuirEntrega =  this.atribuirEntrega.bind(this);
  }

  async listarTodos(req, res, next) {
    try {
      const { status, createdDe, createdAte } = req.query;
      
      let entregas;
      if (status) {
        entregas = await this.service.listarPorStatus(status);
      } else {
        entregas = await this.service.listarTodos();
      }

      if (createdDe || createdAte) { 
        const dataInicio = createdDe ? new Date(createdDe) : null;
        const dataFim = createdAte ? new Date(createdAte) : null;

        if ((dataInicio && Number.isNaN(dataInicio.getTime())) || (dataFim && Number.isNaN(dataFim.getTime()))) {
          throw new AppError('createdDe e createdAte devem estar no formato válido.', 400);
        }

        entregas = entregas.filter(entrega => {
          const createdAt = new Date(entrega.createdAt);
          if (Number.isNaN(createdAt.getTime())) {
            return false;
          }
          if (dataInicio && createdAt < dataInicio) {
            return false;
          }
          if (dataFim && createdAt > dataFim) {
            return false;
          }
          return true;
        });
      }
      res.json(entregas);
    } catch (err) { 
      next(err); 
    }
  }

  async criar(req, res, next) {
    try {
        const novaEntrega = await this.service.criar(req.body);
        res.status(201).json(novaEntrega);
    } catch (err) { 
      next(err); 
    }
  }

  async buscarPorId(req, res, next){
    try{
        const entregaEscolhida = await this.service.buscarPorId(Number(req.params.id));
        res.json(entregaEscolhida); 
    } catch(err){ 
      next(err);
    }
  }

  async avancar(req, res, next){
    try{
        const entregaAtualizada = await this.service.avancarStatus(Number(req.params.id));
        res.status(200).json({
          mensagem: "Status avançado com sucesso",
          entrega: entregaAtualizada
        }); 
    } catch(err){ 
      next(err);
    }
  }

  async cancelar(req, res, next){
    try{
      const entregaCancelada = await this.service.cancelarEntrega(Number(req.params.id));
      res.status(200).json({
        mensagem: "Entrega cancelada com sucesso",
        entrega: entregaCancelada
      }); 
    } catch(err){ 
      next(err);
    }
  }

  async obterHistorico(req, res, next) {
    try {
      const historico = await this.service.obterHistorico(Number(req.params.id));
      res.json(historico);
    } catch(err) {
      next(err);
    }
  }

  async atribuirEntrega(req,res,next){
    try {
      const {motoristaId} = req.body;
      const idEntrega = Number(req.params.id);
      const entregaAtribuida = await this.service.atribuirEntrega(motoristaId,idEntrega);
       res.status(200).json({
        mensagem: "Entrega atribuida com sucesso ao motorista."
      }); 
    } catch (err) {
      next(err);
    }
  }
}