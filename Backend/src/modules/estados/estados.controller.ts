import type { Request, Response, NextFunction } from 'express';
import { EstadosService } from './estados.service';

export class EstadosController
{
    constructor
    (
        private readonly service:
            EstadosService = new EstadosService()
    ) {}

    ListEstadosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            const limit = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;
            const codPais = req.query.codPais ? Number ( req.query.codPais ) : undefined;

            res.status ( 200 ).json ( await this.service.ListEstados ( limit, afterId, codPais ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    GetByIdEstadosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res.status ( 200 ).json ( await this.service.FindEstados ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CreateEstadosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateEstado ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    UpdateEstadosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.UpdateEstado ( Number ( req.params.id ), req.body, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RemoveEstadosController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            await this.service.DeleteEstado ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    }
}
