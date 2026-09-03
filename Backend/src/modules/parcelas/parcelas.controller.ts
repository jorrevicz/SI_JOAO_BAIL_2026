import type { Request, Response, NextFunction } from 'express';
import { ParcelasService } from './parcelas.service';

export class ParcelasController
{
    constructor
    (
        private readonly service: ParcelasService = new ParcelasService()
    ) {}

    ListParcelasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit        = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId      = Number ( req.query.after ) || 0;
            const codCondDePag = req.query.codCondDePag ? Number ( req.query.codCondDePag ) : undefined;

            res.status ( 200 ).json ( await this.service.ListParcelas ( limit, afterId, codCondDePag ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    GetByIdParcelasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.FindParcela ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CreateParcelaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateParcela ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    UpdateParcelaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.UpdateParcela ( Number ( req.params.id ), req.body, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RemoveParcelaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteParcela ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    }
}
