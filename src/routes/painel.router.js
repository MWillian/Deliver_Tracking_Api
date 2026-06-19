import { Router } from 'express';
import { painelMotoristasController, painelEntregasController, painelRelatoriosController } from '../container.js';
import { autorizar, autenticar } from '../middlewares/autenticacao.middleware.js';

export const painelRouter = Router();
painelRouter.use(autenticar);

painelRouter.get('/',painelRelatoriosController.exibirPainelInicial);
painelRouter.get('/motoristas', painelMotoristasController.listarTodos);
painelRouter.get('/motoristas/novo',autorizar('GESTOR'), painelMotoristasController.exibirFormularioCriacao);
painelRouter.post('/motoristas',autorizar('GESTOR'), painelMotoristasController.criar);
painelRouter.get('/motoristas/:id', painelMotoristasController.exibirDetalhe);
painelRouter.get('/motoristas/:id/inativar', autorizar('GESTOR'), painelMotoristasController.inativar);

painelRouter.get('/entregas', painelEntregasController.listarTodos);
painelRouter.get('/entregas/novo', painelEntregasController.exibirFormularioCriacao);
painelRouter.get('/atribuir-motorista', painelEntregasController.exibirAtribuicao);
painelRouter.post('/entregas', painelEntregasController.criar);
painelRouter.post('/atribuir-motorista', painelEntregasController.atribuir);
painelRouter.get('/entregas/:id', painelEntregasController.exibirDetalhe);
painelRouter.patch('/entregas/:id/avancar', painelEntregasController.avancarStatus);
painelRouter.patch('/entregas/:id/cancelar', autorizar('GESTOR'), painelEntregasController.cancelar);

painelRouter.get('/relatorios', autorizar('GESTOR'), painelRelatoriosController.dashboard);
painelRouter.get('/relatorios/entregas-por-status', autorizar('GESTOR'), painelRelatoriosController.exibirEntregasPorStatus);
painelRouter.get('/relatorios/motoristas-ativos', autorizar('GESTOR'), painelRelatoriosController.exibirMotoristasAtivos);

export default painelRouter;
