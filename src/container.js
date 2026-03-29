import { Database } from '../src/database/database.js';

/** @typedef {import('./repositories/IEntregas.repository.js').IEntregasRepository} IEntregasRepository */
/** @typedef {import('./repositories/IMotoristas.repository.js').IMotoristasRepository} IMotoristasRepository */

import { EntregasRepository } from './repositories/entregas.repository.js';
import { MotoristasRepository } from './repositories/motoristas.repository.js';

import { EntregasService } from './services/entregas.services.js';
import { MotoristasService } from './services/motoristas.service.js';

import { EntregasController } from './controllers/entregas.controller.js';
import { MotoristasController } from './controllers/motoristas.controller.js';

const database = new Database();

/** @type {IEntregasRepository} */
const entregasRepository = new EntregasRepository(database);

/** @type {IMotoristasRepository} */
const motoristasRepository = new MotoristasRepository(database);

const entregasService = new EntregasService(entregasRepository, motoristasRepository);
const motoristasService = new MotoristasService(motoristasRepository, entregasRepository);

const entregasController = new EntregasController(entregasService);
const motoristasController = new MotoristasController(motoristasService);

export { entregasController, motoristasController };
