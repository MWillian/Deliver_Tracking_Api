import { Router } from 'express';
import { entregasController } from '../container.js';
import { autorizar } from '../middlewares/autenticacao.middleware.js';
 
const router = Router();

router.get('/', entregasController.listarTodos);
router.post('/',  entregasController.criar);
router.get('/:id', entregasController.buscarPorId);
router.get('/:id/historico', entregasController.obterHistorico);
router.patch('/:id/avancar', entregasController.avancar);
router.patch('/:id/cancelar', autorizar('GESTOR'), entregasController.cancelar);
router.patch('/:id/atribuir', entregasController.atribuirEntrega);

export default router;