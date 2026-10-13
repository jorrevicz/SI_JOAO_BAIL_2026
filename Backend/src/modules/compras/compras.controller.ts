import type { Request, Response, NextFunction } from 'express';
import { ComprasService } from './compras.service';
import type { CompraId } from './compras.repository';
import { chaveCompraSchema } from './compras.schema';

function ExtrairId ( req: Request ): CompraId
{
    return {
        numero:  String ( req.params.numero ),
        modelo:  String ( req.params.modelo ),
        serie:   String ( req.params.serie ),
        codForn: Number ( req.params.codForn ),
    };
}

export class ComprasController
{
    constructor
    (
        private readonly service: ComprasService = new ComprasService()
    ) {}

    ListComprasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit = Math.min ( Number ( req.query.limit ) || 50, 100 );

            const { afterNumero, afterModelo, afterSerie, afterCodForn, codForn } = req.query;
            const afterCursor = ( afterNumero && afterModelo && afterSerie && afterCodForn )
                ? {
                    numero:  String ( afterNumero ),
                    modelo:  String ( afterModelo ),
                    serie:   String ( afterSerie ),
                    codForn: Number ( afterCodForn ),
                }
                : undefined;

            const filtros = { codForn: Number ( codForn ) || undefined };

            res.status ( 200 ).json ( await this.service.ListCompras ( limit, afterCursor, filtros ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    ValidarChaveController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const resultado = chaveCompraSchema.safeParse ( req.query );

            if ( !resultado.success )
            {
                const erros: Record < string, string > = {};

                for ( const issue of resultado.error.issues )
                {
                    const campo = String ( issue.path[ 0 ] ?? '_' );
                    if ( !( campo in erros ) )
                    {
                        erros[ campo ] = issue.message;
                    }
                }

                const mensagem = resultado.error.issues.map ( ( issue ) => issue.message ).join ( '; ' );

                res.status ( 400 ).json ( { mensagem, erros } );
                return;
            }

            res.status ( 200 ).json ( await this.service.ValidarChave ( resultado.data ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdCompraController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.FindCompra ( ExtrairId ( req ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    SimularCompraController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.SimularCompra ( req.body ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GerarParcelasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.GerarParcelas ( req.body ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CreateCompraController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateCompra ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CancelarCompraController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.CancelarCompra ( ExtrairId ( req ), req.body.justificativaCancelamento, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    };
}
