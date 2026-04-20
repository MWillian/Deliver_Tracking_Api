import 'dotenv/config';
import { prisma } from '../src/config/database.js';

const formatDate = date => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const addDays = (base, days) => {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
};

const makeEventos = (status, dataBase, motoristaId) => {
  const eventos = [];

  eventos.push({
    dataEvento: formatDate(dataBase),
    descricao: 'CRIADA',
    motoristaId: null
  });

  if (status === 'EM_TRANSITO' || status === 'ENTREGUE') {
    eventos.push({
      dataEvento: formatDate(addDays(dataBase, 1)),
      descricao: 'EM_TRANSITO',
      motoristaId
    });
  }

  if (status === 'ENTREGUE') {
    eventos.push({
      dataEvento: formatDate(addDays(dataBase, 2)),
      descricao: 'ENTREGUE',
      motoristaId
    });
  }

  if (status === 'CANCELADA') {
    eventos.push({
      dataEvento: formatDate(addDays(dataBase, 1)),
      descricao: 'CANCELADA',
      motoristaId
    });
  }

  return eventos;
};

const seed = async () => {
  await prisma.eventoEntrega.deleteMany();
  await prisma.entrega.deleteMany();
  await prisma.motorista.deleteMany();

  const motoristas = await Promise.all([
    prisma.motorista.create({
      data: {
        nome: 'Ana Souza',
        placa_veiculo: 'ABC1D23',
        cpf: '12345678901',
        status: 'ATIVO'
      }
    }),
    prisma.motorista.create({
      data: {
        nome: 'Bruno Lima',
        placa_veiculo: 'EFG4H56',
        cpf: '23456789012',
        status: 'ATIVO'
      }
    }),
    prisma.motorista.create({
      data: {
        nome: 'Carla Mendes',
        placa_veiculo: 'IJK7L89',
        cpf: '34567890123',
        status: 'INATIVO'
      }
    })
  ]);

  const motoristaIds = motoristas.map(motorista => motorista.id);
  const statusList = [
    'CRIADA',
    'EM_TRANSITO',
    'ENTREGUE',
    'CANCELADA',
    'CRIADA',
    'EM_TRANSITO',
    'ENTREGUE',
    'CANCELADA',
    'EM_TRANSITO',
    'ENTREGUE'
  ];

  const baseDate = new Date();

  for (let i = 0; i < 10; i += 1) {
    const status = statusList[i];
    const motoristaId = status === 'CRIADA' ? null : motoristaIds[i % motoristaIds.length];
    const dataBase = addDays(baseDate, i * -2);

    await prisma.entrega.create({
      data: {
        descricao: `Entrega ${i + 1}`,
        origem: `Origem ${i + 1}`,
        destino: `Destino ${i + 1}`,
        status,
        eventos: {
          create: makeEventos(status, dataBase, motoristaId)
        }
      }
    });
  }
};

seed()
  .catch(error => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
