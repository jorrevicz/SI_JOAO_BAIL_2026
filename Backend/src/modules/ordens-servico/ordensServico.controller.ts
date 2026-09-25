import type { Request, Response, NextFunction } from 'express';
import { OrdensServicoService } from './ordensServico.service';

export class OrdensServicoController
{
    constructor
    (
        private readonly service:
            OrdensServicoService = new OrdensServicoService()
    )
    {}

    ListOrdensServicoController = async (
        req:  Request,
        res:  Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit      = Math.min ( Number ( req.query.limit ) || 50, 100 );
            const afterId    = typeof req.query.after === 'string' ? req.query.after : '';
            const codCliente = req.query.codCliente ? Number ( req.query.codCliente ) : undefined;

            res.status ( 200 ).json ( await this.service.ListOrdensServico ( limit, afterId, codCliente ) );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    GetByIdOrdensServicoController = async (
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
                    await this.service.FindOrdemServico ( String ( req.params.numOdS ) )
                );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    AbrirOrdemServicoController = async (
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
                    await this.service.AbrirOS
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

    DefinirProcedimentosController = async (
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
                    await this.service.DefinirProcedimentosOS
                    (
                        String ( req.params.numOdS ),
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

    RegistrarDiagnosticoController = async (
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
                    await this.service.RegistrarDiagnostico
                    (
                        String ( req.params.numOdS ),
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

    RegistrarExecucaoController = async (
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
                    await this.service.RegistrarExecucao
                    (
                        String ( req.params.numOdS ),
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

    AprovarOrcamentoPecaController = async (
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
                    await this.service.AprovarOrcamentoPeca
                    (
                        String ( req.params.numOdS ),
                        Number ( req.params.codPeca ),
                        req.codUser!
                    )
                );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    ReprovarOrcamentoPecaController = async (
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
                    await this.service.ReprovarOrcamentoPeca
                    (
                        String ( req.params.numOdS ),
                        Number ( req.params.codPeca ),
                        req.codUser!
                    )
                );
        }
        catch ( err )
        {
            next ( err );
        }
    };

    RegistrarSubstituicaoPecasController = async (
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
                    await this.service.RegistrarSubstituicaoPecas
                    (
                        String ( req.params.numOdS ),
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
}
