import { AppError } from "../../utils/AppError.js";

export class PainelMotoristasController {
    constructor(service) {
        this.service = service;
        this.listarTodos = this.listarTodos.bind(this);
        this.exibirFormularioCriacao = this.exibirFormularioCriacao.bind(this);
        this.criar = this.criar.bind(this);
        this.exibirDetalhe = this.exibirDetalhe.bind(this);
    }

    async listarTodos(req, res, next) {
        try {
            res.render('motoristas/index');
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
            res.render('motoristas/detalhe');
        } catch (err) {
            next(err);
        }
    }
}