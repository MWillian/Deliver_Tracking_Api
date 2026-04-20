import { AppError } from '../utils/AppError.js';
import { prisma } from '../config/database.js';

const mapMotorista = motorista => ({
    id: motorista.id,
    nome: motorista.nome,
    placaVeiculo: motorista.placaVeiculo,
    cpf: motorista.cpf,
    status: motorista.status,
    createdAt: motorista.createdAt,
    updatedAt: motorista.updatedAt
});

export class MotoristasRepository{
    constructor(database){
        this.database = database;
    }

    async listarTodos(){
        const motoristas = await prisma.motorista.findMany({
            orderBy: { id: 'asc' }
        });
        return motoristas.map(mapMotorista);
    }

    async listarPorStatus(status){
        const motoristas = await prisma.motorista.findMany({
            where: { status },
            orderBy: { id: 'asc' }
        });
        return motoristas.map(mapMotorista);
    }
    
    async buscarPorId(id){
        const motorista = await prisma.motorista.findUnique({
            where: { id }
        });
        return motorista ? mapMotorista(motorista) : null;
    }

    async buscarPorCpf(cpf){
        const motorista = await prisma.motorista.findUnique({
            where: { cpf }
        });
        return motorista ? mapMotorista(motorista) : null;
    }

    async criar(dados){
        try {
            const motorista = await prisma.motorista.create({
                data: {
                    nome: dados.nome,
                    placa_veiculo: dados.placaVeiculo,
                    cpf: dados.cpf,
                    status: 'ATIVO'
                }
            });
            return mapMotorista(motorista);
        } catch (error) {
            if (error?.code === 'P2002') {
                throw new AppError('Cpf já cadastrado.', 409);
            }
            throw error;
        }
    }

    async atualizar(id, dados){
        try {
            const motorista = await prisma.motorista.update({
                where: { id },
                data: {
                    nome: dados.nome,
                    placaVeiculo: dados.placaVeiculo,
                    cpf: dados.cpf,
                    status: dados.status
                }
            });
            return mapMotorista(motorista);
        } catch (error) {
            if (error?.code === 'P2025') {
                return null;
            }
            if (error?.code === 'P2002') {
                throw new AppError('Cpf já cadastrado.', 409);
            }
            throw error;
        }
    }
}