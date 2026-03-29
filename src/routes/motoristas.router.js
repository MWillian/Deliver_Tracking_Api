import { Router } from 'express';
import { motoristasController } from '../container.js';

const router = Router();

router.get('/', motoristasController.listarTodos);
router.get('/:id', motoristasController.listarPorId);
router.post('/', motoristasController.criar);
router.patch('/:id/inativar', motoristasController.inativarMotorista)
router.get('/:id/entregas', motoristasController.listarEntregas);

export default router;
