export class RelatoriosService {
  /**
   * @param {import('../repositories/relatorios.repository.js').RelatoriosRepository} relatoriosRepository
   */
  constructor(relatoriosRepository) {
    this.relatoriosRepository = relatoriosRepository;
  }

  async obterEntregasPorStatus() {
    const contagens = await this.relatoriosRepository.contarEntregasPorStatus();
    const statusPadrao = {
      CRIADA: 0,
      EM_TRANSITO: 0,
      ENTREGUE: 0,
      CANCELADA: 0
    };

    contagens.forEach(item => {
      if (item.status in statusPadrao) {
        statusPadrao[item.status] = item.total;
      }
    });

    return statusPadrao;
  }

  async obterMotoristasAtivos() {
    return this.relatoriosRepository.listarMotoristasAtivosComEntregasAbertas();
  }
}
