import { Router } from 'express';
import entregasRouter from './entregas.router.js';
import motoristasRouter from './motoristas.router.js'
import relatoriosRouter from './relatorios.router.js';

export const router = Router();

router.use('/entregas', entregasRouter);
router.use('/motoristas', motoristasRouter);
router.use('/relatorios', relatoriosRouter);
