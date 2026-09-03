import type { Request, Response, NextFunction } from 'express';
import { CondicoesPagamentoService } from './condicoesPagamento.service';

export class CondicoesPagamentoController
{
    constructor
    (
        private readonly service: CondicoesPagamentoService = new CondicoesPagamentoService()
    ) {}

    ListCondicoesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListCondicoes ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    GetByIdCondicoesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.FindCondicao ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CreateCondicaoController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateCondicao ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    UpdateCondicaoController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.UpdateCondicao ( Number ( req.params.id ), req.body, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RemoveCondicaoController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteCondicao ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    }
}
