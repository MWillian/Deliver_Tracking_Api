/**
 * Contrato esperado para implementacoes de MotoristasRepository.
 *
 * @typedef {Object} IMotoristasRepository
 * @property {() => Promise<Array<Object>>} listarTodos
 * @property {(status: string) => Promise<Array<Object>>} listarPorStatus
 * @property {(id: number) => Promise<Object|null>} buscarPorId
 * @property {(cpf: string) => Promise<Object|null>} buscarPorCPF
 * @property {(cpf: string) => Promise<Object|null>} buscarPorCpf
 * @property {(dados: Object) => Promise<Object>} criar
 * @property {(id: number, dados: Object) => Promise<Object|null>} atualizar
 */

export {};
