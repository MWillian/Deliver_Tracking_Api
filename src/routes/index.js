import { Router } from 'express';
import entregasRouter from './entregas.router.js';
import motoristasRouter from './motoristas.router.js'
import relatoriosRouter from './relatorios.router.js';
import authRouter from './auth.router.js';
import { autenticar } from '../middlewares/autenticacao.middleware.js';

export const router = Router();

router.use('/auth', authRouter);

router.use(autenticar);

router.use('/entregas', entregasRouter);
router.use('/motoristas', motoristasRouter);
router.use('/relatorios', relatoriosRouter);