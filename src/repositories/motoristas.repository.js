import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

export class MotoristasRepository{
    constructor(database){
        this.database = database;
    }

    async listarTodos(){
        const { rows } = await pool.query(
            `SELECT 
                id,
                nome,
                placa_veiculo AS "placaVeiculo",
                cpf,
                status,
                created_at AS "createdAt",
                updated_at AS "updatedAt"
             FROM motoristas
             ORDER BY id`
        );
        return rows;
    }

    async listarPorStatus(status){
        const { rows } = await pool.query(
            `SELECT 
                id,
                nome,
                placa_veiculo AS "placaVeiculo",
                cpf,
                status,
                created_at AS "createdAt",
                updated_at AS "updatedAt"
             FROM motoristas
             WHERE status = $1
             ORDER BY id`,
            [status]
        );
        return rows;
    }
    
    async buscarPorId(id){
        const { rows } = await pool.query(
            `SELECT 
                id,
                nome,
                placa_veiculo AS "placaVeiculo",
                cpf,
                status,
                created_at AS "createdAt",
                updated_at AS "updatedAt"
             FROM motoristas
             WHERE id = $1`,
            [id]
        );
        return rows[0] ?? null;
    }

    async buscarPorCpf(cpf){
        const { rows } = await pool.query(
            `SELECT 
                id,
                nome,
                placa_veiculo AS "placaVeiculo",
                cpf,
                status,
                created_at AS "createdAt",
                updated_at AS "updatedAt"
             FROM motoristas
             WHERE cpf = $1`,
            [cpf]
        );
        return rows[0] ?? null;
    }

    async criar(dados){
        try {
            const { rows } = await pool.query(
                `INSERT INTO motoristas (nome, placa_veiculo, cpf, status)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, nome, placa_veiculo AS "placaVeiculo", cpf, status`,
                [dados.nome, dados.placaVeiculo, dados.cpf, 'ATIVO']
            );
            return rows[0];
        } catch (error) {
            if (error?.code === '23505') {
                throw new AppError('Cpf já cadastrado.', 409);
            }
            throw error;
        }
    }

    async atualizar(id, dados){
        try {
            const { rows } = await pool.query(
                `UPDATE motoristas 
                 SET nome = $1, placa_veiculo = $2, cpf = $3, status = $4, updated_at = NOW()
                 WHERE id = $5
                 RETURNING id, nome, placa_veiculo AS "placaVeiculo", cpf, status`,
                [dados.nome, dados.placaVeiculo, dados.cpf, dados.status, id]
            );
            return rows[0] ?? null;
        } catch (error) {
            if (error?.code === '23505') {
                throw new AppError('Cpf já cadastrado.', 409);
            }
            throw error;
        }
    }
}