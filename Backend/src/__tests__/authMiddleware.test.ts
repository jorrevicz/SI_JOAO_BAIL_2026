import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../shared/middleware/authMiddleware';

describe('authMiddleware (stub)', () => {
  it('injeta codUser na requisição e chama next', () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authMiddleware(req, res, next);

    expect(req.codUser).toBeDefined();
    expect(typeof req.codUser).toBe('number');
    expect(next).toHaveBeenCalledOnce();
  });
});
