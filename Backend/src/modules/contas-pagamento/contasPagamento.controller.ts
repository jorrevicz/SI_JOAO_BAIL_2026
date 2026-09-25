import type { Request, Response, NextFunction } from 'express';
import { ContasPagamentoService } from './contasPagamento.service';
import type { ContaAPagarId } from './contasPagamento.repository';
import { documentoFiscalSchema } from '../../shared/documento-fiscal/documentoFiscal.schema';

function ExtrairId ( req: Request ): ContaAPagarId
{
    return {
        numero:  String ( req.params.numero ),
        modelo:  String ( req.params.modelo ),
        serie:   String ( req.params.serie ),
        parcela: Number ( req.params.parcela ),
    };
}

export class ContasPagamentoController
{
    constructor
    (
        private readonly service: ContasPagamentoService = new ContasPagamentoService()
    ) {}

    ListContasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const limit = Math.min ( Number ( req.query.limit ) || 50, 100 );

            const { afterNumero, afterModelo, afterSerie, afterParcela } = req.query;
            const afterCursor = ( afterNumero && afterModelo && afterSerie && afterParcela )
                ? {
                    numero:  String ( afterNumero ),
                    modelo:  String ( afterModelo ),
                    serie:   String ( afterSerie ),
                    parcela: Number ( afterParcela ),
                }
                : undefined;

            res.status ( 200 ).json ( await this.service.ListContas ( limit, afterCursor ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    ValidarChaveController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            const resultado = documentoFiscalSchema.safeParse ( req.query );

            if ( !resultado.success )
            {
                const erros: Record < string, string > = {};

                for ( const issue of resultado.error.issues )
                {
                    const campo = String ( issue.path[ 0 ] ?? '_' );
                    if ( !( campo in erros ) )
                    {
                        erros[ campo ] = issue.message;
                    }
                }

                const mensagem = resultado.error.issues.map ( ( issue ) => issue.message ).join ( '; ' );

                res.status ( 400 ).json ( { mensagem, erros } );
                return;
            }

            res.status ( 200 ).json ( await this.service.ValidarChave ( resultado.data ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    GetByIdContasController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json ( await this.service.FindConta ( ExtrairId ( req ) ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CreateContaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 201 ).json ( await this.service.CreateConta ( req.body, req.codUser! ) );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    UpdateContaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.UpdateConta ( ExtrairId ( req ), req.body, req.codUser! )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RegistrarBaixaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.RegistrarBaixa
                (
                    ExtrairId ( req ),
                    req.body.valorBaixa,
                    req.body.dtBaixa,
                    req.codUser!
                )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    CancelarContaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            res.status ( 200 ).json
            (
                await this.service.CancelarConta
                (
                    ExtrairId ( req ),
                    req.body.justificativaCancelamento,
                    req.codUser!
                )
            );
        }
        catch ( err )
        {
            next ( err );
        }
    }

    RemoveContaController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) =>
    {
        try
        {
            await this.service.DeleteConta ( ExtrairId ( req ), req.codUser! );
            res.status ( 204 ).send();
        }
        catch ( err )
        {
            next ( err );
        }
    }
}
