import { prisma } from '../config/database.js';

export class UsuariosRepository {
    async buscarPorEmail(email) {
        return prisma.usuario.findUnique({
            where: { email }
        });
    }

    async criar(dados) {
        return prisma.usuario.create({
            data: {
                nome: dados.nome,
                email: dados.email,
                senha: dados.senha,
                papel: dados.papel || 'OPERADOR'
            }
        });
    }
}