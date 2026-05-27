import { Router } from 'express';
import { relatoriosController } from '../container.js';
import { autorizar } from '../middlewares/autenticacao.middleware.js';

const router = Router();

router.use(autorizar('GESTOR'));

router.get('/entregas-por-status', relatoriosController.entregasPorStatus);
router.get('/motoristas-ativos', relatoriosController.motoristasAtivos);

export default router;