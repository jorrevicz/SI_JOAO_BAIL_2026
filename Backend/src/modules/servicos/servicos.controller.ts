import type { Request, Response, NextFunction } from 'express';
import { ServicosService } from './servicos.service';

export class ServicosController
{
    constructor
    (
        private readonly service:
            ServicosService = new ServicosService()
    )
    {}

    ListServicosController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListServicos ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdServicosController = async (
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
                    await this.service.FindServico
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

    CreateServicosController = async (
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
                    await this.service.CreateServico
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

    UpdateServicosController = async (
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
                    await this.service.UpdateServico
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

    RemoveServicosController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteServico
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
