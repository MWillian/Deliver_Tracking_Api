import { AppError } from '../utils/AppError.js';

export const naoEncontrado = (req, res) => {
  res.status(404).render('erros/404', {
    titulo: 'Página não encontrada',
    mensagem: `A página "${req.path}" não existe.`,
  });
};


export const middlewareDeErros = (err, req, res, next) => {

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  const aceitaJson = req.headers['accept']?.includes('application/json') || req.path.startsWith('/api');

  if (aceitaJson) {
    const status = err instanceof AppError ? err.statusCode : 500;
    return res.status(status).json({ message: err.message });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).render('erros/erro', {
      titulo: `Erro ${err.statusCode}`,
      codigo: err.statusCode,
      mensagem: err.message,
    });
  }

  res.status(500).render('erros/erro', {
    titulo: 'Erro interno',
    codigo: 500,
    mensagem: process.env.NODE_ENV === 'production'
      ? 'Ocorreu um erro inesperado. Tente novamente.'
      : err.message,
  });
};