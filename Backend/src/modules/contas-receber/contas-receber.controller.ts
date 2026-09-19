import type { Request, Response, NextFunction } from 'express';
import { ContasReceberService } from './contas-receber.service';
import type { ContaAReceberId } from './contas-receber.repository';

function ExtrairId ( req: Request ): ContaAReceberId
{
    return {
        numero:  String ( req.params.numero ),
        modelo:  String ( req.params.modelo ),
        serie:   String ( req.params.serie ),
        parcela: Number ( req.params.parcela ),
    };
}

export class ContasReceberController
{
    constructor
    (
        private readonly service: ContasReceberService = new ContasReceberService()
    ) {}

    ListContasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit = Math.min ( Number ( req.query.limit ) || 50, 100 );

            const { afterNumero, afterModelo, afterSerie, afterParcela } = req.query;
            const afterCursor = ( afterNumero && afterModelo && afterSerie && afterParcela )
                ? {
                    numero:  String ( afterNumero ),
                    modelo:  String ( afterModelo ),
                    serie:   String ( afterSerie ),
                    parcela: Number ( afterParcela ),
                }
                : undefined;

            res.status ( 200 ).json ( await this.service.ListContas ( limit, afterCursor ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    GetByIdContasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.FindConta ( ExtrairId ( req ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CreateContaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateConta ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    UpdateContaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.UpdateConta ( ExtrairId ( req ), req.body, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RegistrarPagamentoRecebidoController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.RegistrarPagamentoRecebido
                (
                    ExtrairId ( req ),
                    req.body.valorBaixa,
                    req.body.dtBaixa,
                    req.body.dtPagamento,
                    req.codUser!
                )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CancelarContaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.CancelarConta
                (
                    ExtrairId ( req ),
                    req.body.justificativaCancelamento,
                    req.codUser!
                )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RemoveContaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteConta ( ExtrairId ( req ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    }
}
