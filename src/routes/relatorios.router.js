import { Router } from 'express';
import { relatoriosController } from '../container.js';

const router = Router();

router.get('/entregas-por-status', relatoriosController.entregasPorStatus);
router.get('/motoristas-ativos', relatoriosController.motoristasAtivos);

export default router;
