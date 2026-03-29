/**
 * Contrato esperado para implementacoes de EntregasRepository.
 *
 * @typedef {Object} IEntregasRepository
 * @property {(filtros?: Object) => Promise<Array<Object>>} listarTodos
 * @property {(status: string) => Promise<Array<Object>>} listarPorStatus
 * @property {(id: number) => Promise<Object|null>} buscarPorId
 * @property {(descricao: string, origem: string, destino: string) => Promise<boolean>} verificarDuplicidadeAtiva
 * @property {(dados: Object) => Promise<Object>} criar
 * @property {(id: number, dados: Object) => Promise<Object|null>} atualizar
 */

export {};
