import type { Request, Response, NextFunction } from 'express';
import { PecasService } from './pecas.service';

export class PecasController
{
    constructor
    (
        private readonly service:
            PecasService = new PecasService()
    )
    {}

    ListPecasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListPecas ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdPecasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json
                (
                    await this.service.FindPeca
                    (
                        Number ( req.params.id )
                    )
                );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CreatePecasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 201 )
                .json
                (
                    await this.service.CreatePeca
                    (
                        req.body,
                        req.codUser!
                    )
                );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    UpdatePecasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json
                (
                    await this.service.UpdatePeca
                    (
                        Number ( req.params.id ),
                        req.body,
                        req.codUser!
                    )
                );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    RemovePecasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeletePeca
            (
                Number ( req.params.id ),
                req.codUser!
            );

            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    };
}
