import type { Request, Response, NextFunction } from 'express';
import { VeiculosService } from './veiculos.service';

export class VeiculosController
{
    constructor
    (
        private readonly service:
            VeiculosService = new VeiculosService()
    ) {}

    ListVeiculosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListVeiculos ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdVeiculosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json ( await this.service.FindVeiculo ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CreateVeiculosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 201 )
                .json ( await this.service.CreateVeiculo ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    UpdateVeiculosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json ( await this.service.UpdateVeiculo ( Number ( req.params.id ), req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    RemoveVeiculosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteVeiculo ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    };
}
