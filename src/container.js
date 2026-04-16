/** @typedef {import('./repositories/IEntregas.repository.js').IEntregasRepository} IEntregasRepository */
/** @typedef {import('./repositories/IMotoristas.repository.js').IMotoristasRepository} IMotoristasRepository */

import { EntregasRepository } from './repositories/entregas.repository.js';
import { MotoristasRepository } from './repositories/motoristas.repository.js';
import { RelatoriosRepository } from './repositories/relatorios.repository.js';

import { EntregasService } from './services/entregas.services.js';
import { MotoristasService } from './services/motoristas.service.js';
import { RelatoriosService } from './services/relatorios.service.js';

import { EntregasController } from './controllers/entregas.controller.js';
import { MotoristasController } from './controllers/motoristas.controller.js';
import { RelatoriosController } from './controllers/relatorios.controller.js';

/** @type {IEntregasRepository} */
const entregasRepository = new EntregasRepository();

/** @type {IMotoristasRepository} */
const motoristasRepository = new MotoristasRepository();
const relatoriosRepository = new RelatoriosRepository();

const entregasService = new EntregasService(entregasRepository, motoristasRepository);
const motoristasService = new MotoristasService(motoristasRepository, entregasRepository);
const relatoriosService = new RelatoriosService(relatoriosRepository);

const entregasController = new EntregasController(entregasService);
const motoristasController = new MotoristasController(motoristasService);
const relatoriosController = new RelatoriosController(relatoriosService);

export { entregasController, motoristasController, relatoriosController };
