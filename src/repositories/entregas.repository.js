import { prisma } from '../config/database.js';

const mapHistorico = eventos => eventos.map(evento => ({
    data: evento.dataEvento,
    descricao: evento.descricao,
    motoristaId: evento.motoristaId
}));

const mapEntrega = entrega => ({
    id: entrega.id,
    descricao: entrega.descricao,
    origem: entrega.origem,
    destino: entrega.destino,
    status: entrega.status,
    createdAt: entrega.createdAt,
    updatedAt: entrega.updatedAt,
    historico: mapHistorico(entrega.eventos)
});

export class EntregasRepository{
    constructor(database){
        this.database = database;
    }

    async listarTodos(){
        const entregas = await prisma.entrega.findMany({
            include: {
                eventos: {
                    select: {
                        dataEvento: true,
                        descricao: true,
                        motoristaId: true
                    },
                    orderBy: { id: 'asc' }
                }
            },
            orderBy: { id: 'asc' }
        });

        return entregas.map(mapEntrega);
    }

    async listarPorStatus(status) {
        const entregas = await prisma.entrega.findMany({
            include:{
                eventos: {
                    select: {
                        dataEvento: true,
                        descricao: true,
                        motoristaId: true
                    },
                    orderBy: { id: 'asc' }
                }
            },
            where:{
                status: status
            },
            orderBy: { id: 'asc' }
        });
        
        return entregas.map(mapEntrega);
    };

    async verificarDuplicidadeAtiva(descricao, origem, destino) {
        const entregas = await prisma.entrega.findMany({
            where:{
                descricao: descricao,
                destino: destino,
                origem: origem,
                status:{in: ['CRIADA', 'EM_TRANSITO']}
            },
            take: 1
        });
       return entregas.length > 0;
    }

    async criar(dados){
        const historico = Array.isArray(dados.historico) ? dados.historico : [];
        const entrega = await prisma.entrega.create({
            data: {
                descricao: dados.descricao,
                origem: dados.origem,
                destino: dados.destino,
                status: dados.status,
                eventos: {
                    create: historico.map(evento => ({
                        dataEvento: evento.data,
                        descricao: evento.descricao,
                        motoristaId: evento.motoristaId ?? null
                    }))
                }
            },
            include: {
                eventos: {
                    select: {
                        dataEvento: true,
                        descricao: true,
                        motoristaId: true
                    },
                    orderBy: { id: 'asc' }
                }
            }
        });

        return mapEntrega(entrega);
    }

    async buscarPorId(id){
        const entrega = await prisma.entrega.findUnique({
            where: { id: id },
            include: {
                eventos: {
                    select: {
                        dataEvento: true,
                        descricao: true,
                        motoristaId: true
                    },
                    orderBy: { id: 'asc' }
                }
            }
        });

        return entrega ? mapEntrega(entrega) : null;
    }

    async atualizar(id, dadosAtualizados){
        const historico = Array.isArray(dadosAtualizados.historico) ? dadosAtualizados.historico : [];

        const data = {
            status: dadosAtualizados.status
        };

        if (historico.length > 0) {
            const ultimoEvento = historico[historico.length - 1];
            data.eventos = {
                create: {
                    dataEvento: ultimoEvento.data,
                    descricao: ultimoEvento.descricao,
                    motoristaId: ultimoEvento.motoristaId ?? null
                }
            };
        }

        try {
            const entregaAtualizada = await prisma.entrega.update({
                where: { id : id },
                data,
                include: {
                    eventos: {
                        select: {
                            dataEvento: true,
                            descricao: true,
                            motoristaId: true
                        },
                        orderBy: { id: 'asc' }
                    }
                }
            });

            return mapEntrega(entregaAtualizada);
        } catch (error) {
            if (error?.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }
}