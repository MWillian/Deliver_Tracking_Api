import pg from 'pg';
import { PrismaClient } from '@prisma/client';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max:     10,   
  idleTimeoutMillis: 30000,
});

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export { prisma };