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
      const { status, createdDe, createdAte, page, limit } = req.query;
      
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
          if (!entrega.createdAt) {
            return true;
          }
          const createdAt = new Date(entrega.createdAt);
          if (Number.isNaN(createdAt.getTime())) {
            return true;
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
      const pageNumber = page ? Number(page) : 1;
      const limitNumber = limit ? Number(limit) : 10;

      if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new AppError('page deve ser um inteiro maior ou igual a 1.', 400);
      }

      if (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        throw new AppError('limit deve ser um inteiro entre 1 e 50.', 400);
      }

      const total = entregas.length;
      const totalPages = Math.max(1, Math.ceil(total / limitNumber));
      const startIndex = (pageNumber - 1) * limitNumber;
      const data = entregas.slice(startIndex, startIndex + limitNumber);

      res.json({
        data,
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages
      });
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