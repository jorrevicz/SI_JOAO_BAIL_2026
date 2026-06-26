import type { Request, Response, NextFunction } from 'express';
import { PaisesService } from './paises.service';

export class PaisesController
{
    constructor
    (
        private readonly service:
            PaisesService = new PaisesService()
    ) {}

    ListPaisesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            const limit = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status( 200 ).json ( await this.service.ListPaises( limit, afterId ) );
        }
        catch ( err )
        {
            next( err )
        }
    }

    GetByIdPaisesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res
                .status ( 200 )
                .json 
                ( 
                    await this.service.FindPaises
                    ( 
                        Number ( req.params.id ) 
                    )
                );
        }
        catch ( err )
        {
            next ( err )
        }
    }

    CreatePaisesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res
                .status ( 201 )
                .json 
                ( 
                    await this.service.CreatePais 
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
    }

    UpdatePaisesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try
        {
            res
                .status ( 200 )
                .json
                (
                    await this.service.UpdatePais
                    (
                        Number ( req.params.id ),
                        req.body,
                        req.codUser!
                    )
                );
        }
        catch ( err )
        {
            next ( err )
        }
    }

    RemovePaisesController = async (
        req:Request,
        res:Response,
        next: NextFunction
    ) => {
        try
        {
            await this.service.DeletePais
            (
                Number(req.params.id),
                req.codUser!
            );

            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err )
        }
    }
}
