import type { Request, Response, NextFunction } from 'express';
import { FornecedoresService } from './fornecedores.service';

export class FornecedoresController
{
    constructor
    (
        private readonly service:
            FornecedoresService = new FornecedoresService()
    ) {}

    ListFornecedoresController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListFornecedores ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdFornecedoresController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json ( await this.service.FindFornecedor ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CreateFornecedoresController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 201 )
                .json ( await this.service.CreateFornecedor ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    UpdateFornecedoresController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json ( await this.service.UpdateFornecedor ( Number ( req.params.id ), req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    RemoveFornecedoresController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteFornecedor ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    };
}
