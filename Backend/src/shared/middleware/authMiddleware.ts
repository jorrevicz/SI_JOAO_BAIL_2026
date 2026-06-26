import type { Request, Response, NextFunction } from 'express';

// Stub: injeta codUser fixo até EP-10 implementar autenticação real (JWT/sessão)
export function AuthMiddleware ( req: Request, _res: Response, next: NextFunction ): void 
{
  req.codUser = 1;
  next();
}
