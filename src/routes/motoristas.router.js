import {Router} from 'express';
import {MotoristasRepository} from '../repositories/motoristas.repository.js';
import {MotoristasService} from '../services/motoristas.service.js';
import { Database } from '../database/database.js';
import { MotoristasController } from '../controllers/motoristas.controller.js';

const router = Router();

const database = new Database();
const repository = new MotoristasRepository(database);
const service = new MotoristasService(repository);
const controller = new MotoristasController(service);

router.get('/', controller.listarTodos);
router.get('/:id', controller.listarPorId);
router.post('/',controller.criar);
router.get('/:id/entregas', controller.listarEntregas)

export default router;
