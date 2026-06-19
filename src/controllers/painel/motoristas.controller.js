import { AppError } from "../../utils/AppError.js";

export class PainelMotoristasController {
    constructor(service) {
        this.service = service;
        this.listarTodos = this.listarTodos.bind(this);
        this.exibirFormularioCriacao = this.exibirFormularioCriacao.bind(this);
        this.criar = this.criar.bind(this);
        this.exibirDetalhe = this.exibirDetalhe.bind(this);
        this.inativar = this.inativar.bind(this);
    }

    async listarTodos(req, res, next) {
        try {
            const { status, sucesso, erro } = req.query;
            let motoristas;

            if (status) {
                motoristas = await this.service.listarComFiltros(status);
            } else {
                motoristas = await this.service.listarTodos();
            }

            res.render('motoristas/index', {
                motoristas,
                sucesso,
                erro,
                statusSelecionado: status || ''
            });
        } catch (err) {
            next(err);
        }
    }

    async exibirFormularioCriacao(req, res, next) {
        try {
            res.render('motoristas/novo', {
                motorista: {},
                erros: {}
            });
        } catch (err) {
            next(err);
        }
    }

    async criar(req, res, next) {
        try {
            const { nome, cpf, placaVeiculo } = req.body;

            const novoMotorista = await this.service.criar({
                nome,
                cpf,
                placaVeiculo
            });

            res.redirect('/painel/motoristas?sucesso=Motorista criado com sucesso');
        } catch (err) {
            return res.render('motoristas/novo', {
                motorista: req.body,
                erros: { mensagem: err.message }
            });
        }
    }

    async exibirDetalhe(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { status, sucesso } = req.query;

            if (!Number.isInteger(id) || id < 1) {
                throw new AppError('ID inválido.', 404);
            }

            const motorista = await this.service.listarPorId(id);
            const entregas = await this.service.listarEntregasPorId(id, { status });

            res.render('motoristas/detalhe', {
                motorista,
                entregas,
                statusSelecionado: status || '',
                sucesso
            });
        } catch (err) {
            next(err);
        }
    }
    async inativar(req, res, next) {
        try {
            const motoristaCancelado = await this.service.inativar(Number(req.params.id));
            res.redirect('/painel/motoristas?sucesso=Motorista inativado com sucesso');
        } catch (err) {
            res.redirect(`/painel/motoristas?erro=${encodeURIComponent(err.message)}`);
        }
    }
}