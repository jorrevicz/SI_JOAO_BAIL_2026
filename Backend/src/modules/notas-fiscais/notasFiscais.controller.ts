import type { Request, Response, NextFunction } from 'express';
import { NotasFiscaisService } from './notasFiscais.service';
import type { NotaFiscalId } from './notasFiscais.repository';

// A nota é identificada pelas mesmas chaves da compra: /:numero/:modelo/:serie/:codFornecedor.
function ExtrairId ( req: Request ): NotaFiscalId
{
    return {
        numero:        String ( req.params.numero ),
        modelo:        String ( req.params.modelo ),
        serie:         String ( req.params.serie ),
        codFornecedor: Number ( req.params.codFornecedor ),
    };
}

export class NotasFiscaisController
{
    constructor
    (
        private readonly service: NotasFiscaisService = new NotasFiscaisService()
    ) {}

    ListNotasFiscaisController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit = Math.min ( Number ( req.query.limit ) || 50, 100 );

            const { afterNumero, afterModelo, afterSerie, afterCodFornecedor, codFornecedor } = req.query;
            const afterCursor = ( afterNumero && afterModelo && afterSerie && afterCodFornecedor )
                ? {
                    numero:        String ( afterNumero ),
                    modelo:        String ( afterModelo ),
                    serie:         String ( afterSerie ),
                    codFornecedor: Number ( afterCodFornecedor ),
                }
                : undefined;

            const filtros = { codFornecedor: Number ( codFornecedor ) || undefined };

            res.status ( 200 ).json ( await this.service.ListNotasFiscais ( limit, afterCursor, filtros ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdNotaFiscalController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.FindNotaFiscal ( ExtrairId ( req ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CalcularNotaFiscalController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.CalcularNotaFiscal ( req.body ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GerarNotaFiscalController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 201 ).json ( await this.service.GerarNotaFiscal ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CancelarNotaFiscalController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.CancelarNotaFiscal ( ExtrairId ( req ), req.body.justificativaCancelamento, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    };
}
