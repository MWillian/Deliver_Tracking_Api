import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { prisma } from '../src/config/database.js'; 

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});