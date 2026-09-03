import type { Request, Response, NextFunction } from 'express';
import { TransportadorasService } from './transportadoras.service';

export class TransportadorasController
{
    constructor
    (
        private readonly service:
            TransportadorasService = new TransportadorasService()
    ) {}

    ListTransportadorasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListTransportadoras ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdTransportadorasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json ( await this.service.FindTransportadora ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CreateTransportadorasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 201 )
                .json ( await this.service.CreateTransportadora ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    UpdateTransportadorasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json ( await this.service.UpdateTransportadora ( Number ( req.params.id ), req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    RemoveTransportadorasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteTransportadora ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    };
}
