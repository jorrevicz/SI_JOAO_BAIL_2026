import type { Request, Response, NextFunction } from 'express';
import { FormasPagamentoService } from './formasPagamento.service';

export class FormasPagamentoController
{
    constructor
    (
        private readonly service: FormasPagamentoService = new FormasPagamentoService()
    ) {}

    ListFormasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListFormas ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    GetByIdFormasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.FindForma ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CreateFormaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateForma ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    UpdateFormaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.UpdateForma ( Number ( req.params.id ), req.body, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RemoveFormaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteForma ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    }
}
