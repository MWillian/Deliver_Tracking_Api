import { Router } from 'express';
import { motoristasController } from '../container.js';
import { autorizar } from '../middlewares/autenticacao.middleware.js';

const router = Router();

router.get('/', motoristasController.listarTodos);
router.get('/:id', motoristasController.listarPorId);
router.post('/', autorizar('GESTOR'), motoristasController.criar);
router.get('/:id/entregas', motoristasController.listarEntregas);
router.patch('/:id/inativar', autorizar('GESTOR'), motoristasController.inativarMotorista)

export default router;
