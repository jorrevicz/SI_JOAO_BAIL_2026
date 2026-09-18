import type { Request, Response, NextFunction } from 'express';
import { ProdutoCategoriasService } from './produtoCategorias.service';

export class ProdutoCategoriasController
{
    constructor
    (
        private readonly service: ProdutoCategoriasService = new ProdutoCategoriasService()
    ) {}

    ListProdutoCategoriasController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit      = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId    = Number ( req.query.after ) || 0;
            const codProduto = req.query.codProduto ? Number ( req.query.codProduto ) : undefined;

            res.status ( 200 ).json ( await this.service.ListVinculos ( limit, afterId, codProduto ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CreateProdutoCategoriaController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateVinculo ( req.body ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    RemoveProdutoCategoriaController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteVinculo
            (
                Number ( req.params.codProduto ),
                Number ( req.params.codCategoria )
            );

            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    };
}
