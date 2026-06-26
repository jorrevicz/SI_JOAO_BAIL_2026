import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

export function Validate ( schema: ZodType ) 
{
  return ( req: Request, res: Response, next: NextFunction ): void => {
    const resultado = schema.safeParse ( req.body );

    if ( !resultado.success ) 
    {
      const erros: Record < string, string > = {};

      for ( const issue of resultado.error.issues )
      {
        const campo = String ( issue.path[ 0 ] ?? '_' );
        if ( !(campo in erros) )
        {
          erros[ campo ] = issue.message;
        }
      }

      const mensagem = resultado.error.issues.map ( ( issue ) => issue.message ).join ( '; ' );

      res.status ( 400 ).json ( { mensagem, erros } );
      return;
    }

    req.body = resultado.data;
    next();
  };
}
