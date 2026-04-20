import { pool } from '../config/database.js';

export class EntregasRepository{
    constructor(database){
        this.database = database;
    }

    async listarTodos(){
        const { rows } = await pool.query(
            `SELECT 
                e.id,
                e.descricao,
                e.origem,
                e.destino,
                e.status,
                e.created_at AS "createdAt",
                e.updated_at AS "updatedAt",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'data', ev.data_evento,
                            'descricao', ev.descricao,
                            'motoristaId', ev.motorista_id
                        ) ORDER BY ev.id
                    ) FILTER (WHERE ev.id IS NOT NULL),
                    '[]'
                ) AS historico
            FROM entregas e
            LEFT JOIN eventos_entrega ev ON ev.entrega_id = e.id
            GROUP BY e.id
            ORDER BY e.id`
        );
        return rows;
    }

    async listarPorStatus(status) {
        const { rows } = await pool.query(
            `SELECT 
                e.id,
                e.descricao,
                e.origem,
                e.destino,
                e.status,
                e.created_at AS "createdAt",
                e.updated_at AS "updatedAt",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'data', ev.data_evento,
                            'descricao', ev.descricao,
                            'motoristaId', ev.motorista_id
                        ) ORDER BY ev.id
                    ) FILTER (WHERE ev.id IS NOT NULL),
                    '[]'
                ) AS historico
            FROM entregas e
            LEFT JOIN eventos_entrega ev ON ev.entrega_id = e.id
            WHERE e.status = $1
            GROUP BY e.id
            ORDER BY e.id`,
            [status]
        );
        return rows;
    }

    async verificarDuplicidadeAtiva(descricao, origem, destino) {
        const { rows } = await pool.query(
            `SELECT 1 
             FROM entregas 
             WHERE descricao = $1 
               AND origem = $2 
               AND destino = $3 
               AND status IN ('CRIADA', 'EM_TRANSITO')
             LIMIT 1`,
            [descricao, origem, destino]
        );
        return rows.length > 0;
    }

    async criar(dados){
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: entregaRows } = await client.query(
                `INSERT INTO entregas (descricao, origem, destino, status) 
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, descricao, origem, destino, status`,
                [dados.descricao, dados.origem, dados.destino, dados.status]
            );

            const entrega = entregaRows[0];
            const historico = Array.isArray(dados.historico) ? dados.historico : [];

            for (const evento of historico) {
                await client.query(
                    `INSERT INTO eventos_entrega (entrega_id, data_evento, descricao, motorista_id)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        entrega.id,
                        evento.data,
                        evento.descricao,
                        evento.motoristaId ?? null
                    ]
                );
            }

            await client.query('COMMIT');
            return await this.buscarPorId(entrega.id);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async buscarPorId(id){
        const { rows } = await pool.query(
            `SELECT 
                e.id,
                e.descricao,
                e.origem,
                e.destino,
                e.status,
                e.created_at AS "createdAt",
                e.updated_at AS "updatedAt",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'data', ev.data_evento,
                            'descricao', ev.descricao,
                            'motoristaId', ev.motorista_id
                        ) ORDER BY ev.id
                    ) FILTER (WHERE ev.id IS NOT NULL),
                    '[]'
                ) AS historico
            FROM entregas e
            LEFT JOIN eventos_entrega ev ON ev.entrega_id = e.id
            WHERE e.id = $1
            GROUP BY e.id`,
            [id]
        );
        return rows[0] ?? null;
    }

    async atualizar(id, dadosAtualizados){
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: entregaRows } = await client.query(
                `UPDATE entregas 
                 SET status = $1, updated_at = NOW()
                 WHERE id = $2 
                 RETURNING id`,
                [dadosAtualizados.status, id]
            );

            if (entregaRows.length === 0) {
                await client.query('COMMIT');
                return null;
            }

            const historico = Array.isArray(dadosAtualizados.historico)
                ? dadosAtualizados.historico
                : [];

            if (historico.length > 0) {
                const ultimoEvento = historico[historico.length - 1];
                await client.query(
                    `INSERT INTO eventos_entrega (entrega_id, data_evento, descricao, motorista_id)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        id,
                        ultimoEvento.data,
                        ultimoEvento.descricao,
                        ultimoEvento.motoristaId ?? null
                    ]
                );
            }

            await client.query('COMMIT');
            return await this.buscarPorId(id);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}