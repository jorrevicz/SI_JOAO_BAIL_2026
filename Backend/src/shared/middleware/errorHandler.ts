import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

type ErroCampoUnico = { campo: string; mensagem: string };

const CONSTRAINT_CAMPO: Record < string, ErroCampoUnico > = {
  'Paises_sigla_key':          { campo: 'sigla',  mensagem: 'Esta sigla já está cadastrada.'                       },
  'Paises_ddi_key':            { campo: 'ddi',    mensagem: 'Este DDI já está cadastrado.'                         },
  'Estados_codPais_uf_key':    { campo: 'uf',     mensagem: 'Esta UF já está cadastrada para este país.'           },
  'Users_email_key':           { campo: 'email',  mensagem: 'Este e-mail já está cadastrado.'                      },
};

export function ErrorHandler
(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void
{
  if ( err instanceof AppError )
  {
    res.status ( err.status ).json ( { mensagem: err.mensagem } );
    return;
  }

  if ( 'code' in err )
  {
    const pgErr   = err as { code: string; constraint?: string };
    const pgCode  = pgErr.code;

    if ( pgCode === '23505' )
    {
      const mapeado  = pgErr.constraint ? CONSTRAINT_CAMPO[ pgErr.constraint ] : undefined;
      const mensagem = mapeado?.mensagem ?? 'Registro duplicado: este valor já existe.';
      const erros    = mapeado ? { [ mapeado.campo ]: mapeado.mensagem } : undefined;

      res.status ( 409 ).json ( erros ? { mensagem, erros } : { mensagem } );
      return;
    }

    if ( pgCode === '23503' )
    {
      res.status ( 409 ).json ( { mensagem: 'Operação bloqueada: este registro possui dependências.' } );
      return;
    }
  }

  console.error ( '[Erro inesperado]', err );
  res.status ( 500 ).json ( { mensagem: 'Erro interno do servidor' } );
}
