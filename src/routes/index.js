import { Router } from 'express';
import EntregasRouter from './entregas.router.js';
import MotoristasRouter from './motoristas.router.js'

export const router = Router();

router.use('/entregas', EntregasRouter);
router.use('/motoristas', MotoristasRouter);
