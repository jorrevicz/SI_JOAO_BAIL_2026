import type { Request, Response, NextFunction } from 'express';
import { CidadesService } from './cidades.service';

export class CidadesController
{
    constructor
    (
        private readonly service:
            CidadesService = new CidadesService()
    ) {}

    ListCidadesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            const limit     = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId   = Number ( req.query.after ) || 0;
            const codEstado = req.query.codEstado ? Number ( req.query.codEstado ) : undefined;

            res.status ( 200 ).json ( await this.service.ListCidades ( limit, afterId, codEstado ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    GetByIdCidadesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res.status ( 200 ).json ( await this.service.FindCidades ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CreateCidadesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateCidade ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    UpdateCidadesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.UpdateCidade ( Number ( req.params.id ), req.body, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RemoveCidadesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            await this.service.DeleteCidade ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    }
}
