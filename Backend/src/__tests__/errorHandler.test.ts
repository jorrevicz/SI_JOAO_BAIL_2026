import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { errorHandler } from '../shared/middleware/errorHandler';

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };

  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

const mockReq = {} as Request;
const next = vi.fn() as unknown as NextFunction;

describe('AppError', () => {
  it('armazena mensagem e status', () => {
    const err = new AppError('Não encontrado', 404);

    expect(err.mensagem).toBe('Não encontrado');
    expect(err.status).toBe(404);
    expect(err).toBeInstanceOf(Error);
  });

  it('usa status 400 como padrão', () => {
    const err = new AppError('Inválido');

    expect(err.status).toBe(400);
  });
});

describe('errorHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna status e mensagem do AppError', () => {
    const mockRes = makeRes();

    errorHandler(new AppError('Recurso não encontrado', 404), mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      mensagem: 'Recurso não encontrado' 
    });
  });

  it('retorna 500 para erros genéricos', () => {
    const mockRes = makeRes();

    errorHandler(new Error('falha interna'), mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      mensagem: 'Erro interno do servidor' 
    });
  });

  it('retorna 409 para violação unique (PG 23505)', () => {
    const pgError = Object.assign(new Error('unique violation'), {code: '23505'});
    const mockRes = makeRes();

    errorHandler(pgError, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      menssagem: 'Registro duplicado: este valor já existe.',
    });
  });

  it('retorna 409 para violação de FK (PG 23503', () => {
    const pgError = Object.assign(new Error('fk violation'), {code: '23503'});
    const mockRes = makeRes();

    errorHandler(pgError, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      menssagem: 'Operação bloqueada: este registro possui dependências',
    })
  });
});
