import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../shared/validation/validate';

const schema = z.object({
  nome: z.string({ error: 'Nome é obrigatório' }).min(1, 'Nome não pode ser vazio'),
  idade: z.number({ error: 'Idade é obrigatória' }).int().positive('Idade deve ser positiva'),
});

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

describe('validate', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn() as unknown as NextFunction;
  });

  it('chama next e preserva body quando payload é válido', () => {
    const req = { body: { nome: 'Produto A', idade: 10 } } as Request;
    const res = makeRes();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ nome: 'Produto A', idade: 10 });
  });

  it('retorna 400 com mensagem em português quando campo obrigatório falta', () => {
    const req = { body: { nome: 'Produto A' } } as Request;
    const res = makeRes();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      mensagem: string;
    };
    expect(jsonArg.mensagem).toContain('Idade é obrigatória');
  });

  it('retorna 400 quando tipo de campo é inválido', () => {
    const req = { body: { nome: '', idade: -5 } } as Request;
    const res = makeRes();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
