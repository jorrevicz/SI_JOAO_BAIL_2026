import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void 
{
  if (err instanceof AppError)
  {
    res.status(err.status).json({ mensagem: err.mensagem });
    return;
  }

  if ('code' in err)
  {
    const pgCode = (err as { code: string }).code;
    if (pgCode === '23505')
    {
      res.status(409).json({
        menssagem: 'Registro duplicado: este valor já existe.',
      });
      return;
    }
    if (pgCode === '23503')
    {
        res.status(409).json({
          menssagem: 'Operação bloqueada: este registro possui dependências',
        })
        return;
    }
  }

  console.error('[Erro inesperado]', err);
  res.status(500).json({ 
    mensagem: 'Erro interno do servidor' 
  });
}
