import type { Request, Response, NextFunction } from 'express';
import { ProdutosService } from './produtos.service';

export class ProdutosController
{
    constructor
    (
        private readonly service:
            ProdutosService = new ProdutosService()
    )
    {}

    ListProdutosController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListProdutos ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdProdutosController = async (
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
                    await this.service.FindProduto
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

    CreateProdutosController = async (
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
                    await this.service.CreateProduto
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

    UpdateProdutosController = async (
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
                    await this.service.UpdateProduto
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

    RemoveProdutosController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteProduto
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
