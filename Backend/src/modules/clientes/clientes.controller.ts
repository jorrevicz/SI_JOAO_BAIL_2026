import type { Request, Response, NextFunction } from 'express';
import { ClientesService } from './clientes.service';

export class ClientesController
{
    constructor
    (
        private readonly service:
            ClientesService = new ClientesService()
    ) {}

    ListClientesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit   = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId = Number ( req.query.after ) || 0;

            res.status ( 200 ).json ( await this.service.ListClientes ( limit, afterId ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdClientesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json ( await this.service.FindCliente ( Number ( req.params.id ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    CreateClientesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 201 )
                .json ( await this.service.CreateCliente ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    UpdateClientesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res
                .status ( 200 )
                .json ( await this.service.UpdateCliente ( Number ( req.params.id ), req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    RemoveClientesController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteCliente ( Number ( req.params.id ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    };
}
