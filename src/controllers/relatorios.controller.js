export class RelatoriosController {
  constructor(service) {
    this.service = service;
    this.entregasPorStatus = this.entregasPorStatus.bind(this);
    this.motoristasAtivos = this.motoristasAtivos.bind(this);
  }

  async entregasPorStatus(req, res, next) {
    try {
      const relatorio = await this.service.obterEntregasPorStatus();
      res.json(relatorio);
    } catch (err) {
      next(err);
    }
  }

  async motoristasAtivos(req, res, next) {
    try {
      const relatorio = await this.service.obterMotoristasAtivos();
      res.json(relatorio);
    } catch (err) {
      next(err);
    }
  }
}
