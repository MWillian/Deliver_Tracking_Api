import { AppError } from '../../utils/AppError.js';

export class PainelEntregasController {
    constructor(service, motoristasService) {
        this.service = service;
        this.motoristasService = motoristasService;
        this.listarTodos = this.listarTodos.bind(this);
        this.exibirFormularioCriacao = this.exibirFormularioCriacao.bind(this);
        this.criar = this.criar.bind(this);
        this.exibirDetalhe = this.exibirDetalhe.bind(this);
        this.avancarStatus = this.avancarStatus.bind(this);
        this.cancelar = this.cancelar.bind(this);
        this.exibirAtribuicao = this.exibirAtribuicao.bind(this);
        this.atribuir = this.atribuir.bind(this);
    }

    async listarTodos(req, res, next) {
        try {
            const { status, sucesso, page } = req.query;
            let entregas;

            if (status) {
                entregas = await this.service.listarPorStatus(status);
            } else {
                entregas = await this.service.listarTodos();
            }

            const pageNumber = page ? Number(page) : 1;
            const limitNumber = 10;

            if (!Number.isInteger(pageNumber) || pageNumber < 1) {
                throw new AppError('page deve ser um inteiro maior ou igual a 1.', 400);
            }

            const total = entregas.length;
            const totalPages = Math.max(1, Math.ceil(total / limitNumber));
            const startIndex = (pageNumber - 1) * limitNumber;
            const data = entregas.slice(startIndex, startIndex + limitNumber);

            res.render('entregas/index', {
                entregas: data,
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                statusSelecionado: status || '',
                sucesso
            });
        } catch (err) {
            next(err);
        }
    }

    async exibirFormularioCriacao(req, res, next) {
        try {
            res.render('entregas/nova', { entrega: {} });
        } catch (err) {
            next(err);
        }
    }

    async criar(req, res, next) {
        try {
            const { descricao, origem, destino } = req.body;
            await this.service.criar({ descricao, origem, destino });
            res.redirect('/painel/entregas?sucesso=Entrega criada com sucesso.');
        } catch (err) {
            if (err instanceof AppError) {
                return res.render('entregas/nova', {
                    entrega: req.body,
                    erro: err.message
                });
            }
            next(err);
        }
    }

    async exibirDetalhe(req, res, next) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id < 1) {
                throw new AppError('ID inválido.', 400);
            }

            const entrega = await this.service.buscarPorId(id);
            const historico = await this.service.obterHistorico(id);

            res.render('entregas/detalhe', {
                entrega,
                historico: Array.isArray(historico) ? historico : [],
                sucesso: req.query.sucesso || '',
                erro: req.query.erro || ''
            });
        } catch (err) {
            next(err);
        }
    }

    async avancarStatus(req, res, next) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id < 1) {
                throw new AppError('ID inválido.', 400);
            }

            await this.service.avancarStatus(id);
            res.redirect(`/painel/entregas/${id}?sucesso=Status%20avancado%20com%20sucesso.`);
        } catch (err) {
            if (err instanceof AppError) {
                return res.redirect(`/painel/entregas/${req.params.id}?erro=${encodeURIComponent(err.message)}`);
            }
            next(err);
        }
    }

    async cancelar(req, res, next) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id < 1) {
                throw new AppError('ID inválido.', 400);
            }

            await this.service.cancelarEntrega(id);
            res.redirect(`/painel/entregas/${id}?sucesso=Entrega%20cancelada%20com%20sucesso.`);
        } catch (err) {
            if (err instanceof AppError) {
                return res.redirect(`/painel/entregas/${req.params.id}?erro=${encodeURIComponent(err.message)}`);
            }
            next(err);
        }
    }

    async exibirAtribuicao(req, res, next) {
        try {
            const entregas = await this.service.listarTodos();
            const motoristas = await this.motoristasService.listarTodos();

            res.render('painel/atribuir-motorista', {
                entregas,
                motoristas,
                erro: req.query.erro || '',
                sucesso: req.query.sucesso || ''
            });
        } catch (err) {
            next(err);
        }
    }

    async atribuir(req, res, next) {
        try {
            const { motoristaId, entregaId } = req.body;

            if (!motoristaId || !entregaId) {
                throw new AppError('Motorista e Entrega são obrigatórios.', 400);
            }

            const idMotorista = Number(motoristaId);
            const idEntrega = Number(entregaId);

            if (!Number.isInteger(idMotorista) || idMotorista < 1) {
                throw new AppError('ID do motorista inválido.', 400);
            }

            if (!Number.isInteger(idEntrega) || idEntrega < 1) {
                throw new AppError('ID da entrega inválido.', 400);
            }

            await this.service.atribuirEntrega(idMotorista, idEntrega);
            res.redirect('/painel/atribuir-motorista?sucesso=Motorista%20atribuído%20com%20sucesso.');
        } catch (err) {
            if (err instanceof AppError) {
                return res.redirect(`/painel/atribuir-motorista?erro=${encodeURIComponent(err.message)}`);
            }
            next(err);
        }
    }
}
