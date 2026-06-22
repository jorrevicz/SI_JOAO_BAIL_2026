import type { Request, Response, NextFunction } from 'express';
import type { ZodType, ZodIssue } from 'zod';

export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      const mensagem = resultado.error.issues.map((e: ZodIssue) => e.message).join('; ');
      res.status(400).json({ mensagem });
      return;
    }

    req.body = resultado.data;
    next();
  };
}
