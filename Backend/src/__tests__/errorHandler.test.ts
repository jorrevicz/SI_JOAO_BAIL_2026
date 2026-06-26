import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { ErrorHandler } from '../shared/middleware/errorHandler';

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

describe('ErrorHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna status e mensagem do AppError', () => {
    const mockRes = makeRes();

    ErrorHandler(new AppError('Recurso não encontrado', 404), mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      mensagem: 'Recurso não encontrado' 
    });
  });

  it('retorna 500 para erros genéricos', () => {
    const mockRes = makeRes();

    ErrorHandler(new Error('falha interna'), mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      mensagem: 'Erro interno do servidor' 
    });
  });

  it ( 'retorna 409 com mensagem genérica para violação unique sem constraint conhecida (PG 23505)', () => {
    const pgError = Object.assign ( new Error ( 'unique violation' ), { code: '23505' } );
    const mockRes = makeRes();

    ErrorHandler ( pgError, mockReq, mockRes, next );

    expect ( mockRes.status ).toHaveBeenCalledWith ( 409 );
    expect ( mockRes.json ).toHaveBeenCalledWith ( {
      mensagem: 'Registro duplicado: este valor já existe.',
    } );
  } );

  it ( 'retorna 409 com erros por campo para violação unique de constraint conhecida (PG 23505)', () => {
    const pgError = Object.assign ( new Error ( 'unique violation' ), {
      code: '23505',
      constraint: 'Paises_ddi_key',
    } );
    const mockRes = makeRes();

    ErrorHandler ( pgError, mockReq, mockRes, next );

    expect ( mockRes.status ).toHaveBeenCalledWith ( 409 );
    const jsonArg = ( mockRes.json as ReturnType < typeof vi.fn > ).mock.calls[ 0 ][ 0 ] as {
      mensagem: string;
      erros: Record < string, string >;
    };
    expect ( jsonArg.mensagem ).toBe ( 'Este DDI já está cadastrado.' );
    expect ( jsonArg.erros.ddi ).toBe ( 'Este DDI já está cadastrado.' );
  } );

  it ( 'retorna 409 para violação de FK (PG 23503)', () => {
    const pgError = Object.assign ( new Error ( 'fk violation' ), { code: '23503' } );
    const mockRes = makeRes();

    ErrorHandler ( pgError, mockReq, mockRes, next );

    expect ( mockRes.status ).toHaveBeenCalledWith ( 409 );
    expect ( mockRes.json ).toHaveBeenCalledWith ( {
      mensagem: 'Operação bloqueada: este registro possui dependências.',
    } );
  } );
});
