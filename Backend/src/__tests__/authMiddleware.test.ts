import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../shared/middleware/authMiddleware';

describe('AuthMiddleware (stub)', () => {
  it('injeta codUser na requisição e chama next', () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    AuthMiddleware(req, res, next);

    expect(req.codUser).toBe(1);
    expect(next).toHaveBeenCalledOnce();
  });
});
