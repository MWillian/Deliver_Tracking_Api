import { pool } from '../config/database.js';

export class RelatoriosRepository {
  async contarEntregasPorStatus() {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*)::int AS total
       FROM entregas
       GROUP BY status`
    );
    return rows;
  }

  async listarMotoristasAtivosComEntregasAbertas() {
    const { rows } = await pool.query(
      `SELECT
        m.id AS "motoristaId",
        m.nome,
        COUNT(DISTINCT e.id)::int AS "entregasEmAberto"
       FROM motoristas m
       JOIN eventos_entrega ev ON ev.motorista_id = m.id
       JOIN entregas e ON e.id = ev.entrega_id
       WHERE e.status NOT IN ('ENTREGUE', 'CANCELADA')
       GROUP BY m.id, m.nome
       HAVING COUNT(DISTINCT e.id) > 0
       ORDER BY m.id`
    );
    return rows;
  }
}
