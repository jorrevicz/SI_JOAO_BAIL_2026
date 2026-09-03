import type { Request, Response, NextFunction } from 'express';
import { CategoriasService } from './categorias.service';

export class CategoriasController
{
    constructor
    (
        private readonly service:
            CategoriasService = new CategoriasService()
    )
    {}

    ListCategoriasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListCategorias ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdCategoriasController = async (
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
                    await this.service.FindCategoria
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

    CreateCategoriasController = async (
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
                    await this.service.CreateCategoria
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

    UpdateCategoriasController = async (
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
                    await this.service.UpdateCategoria
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

    RemoveCategoriasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteCategoria
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
