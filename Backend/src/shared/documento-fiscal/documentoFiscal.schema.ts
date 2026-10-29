import { z } from 'zod';

export const documentoFiscalSchema = z.object
(
    {
        modelo: z
            .coerce.string ( { message: "O código do modelo deve ser campo numérico com zeros à esquerda (ex: '01')." } )
            .min ( 2 )
            .max ( 2 )
            .nonempty ( { message: 'O documento deve possuir um código do modelo.' } )
            .regex ( /^[0-9]+$/, 'O identificador deve conter apenas números.' )
            .refine ( ( valor ) => valor.length !== 2 || !/^0+$/.test ( valor ), 'O código do modelo não pode ser preenchido apenas com zeros.' ),
        numero: z
            .coerce.string ( { message: "O código numérico deve ser campo numérico com zeros à esquerda (ex: '012345678')." } )
            .min ( 9 )
            .max ( 9 )
            .nonempty ( { message: 'O documento deve possuir um código numérico.' } )
            .regex ( /^[0-9]+$/, 'O identificador deve conter apenas números.' )
            .refine ( ( valor ) => valor.length !== 9 || !/^0+$/.test ( valor ), 'O código numérico não pode ser preenchido apenas com zeros.' ), 
        serie: z
            .coerce.string ( { message: "O código de série deve ser campo numérico com zeros à esquerda (ex: '01')." } )
            .min ( 2 )
            .max ( 2 )
            .nonempty ( { message: 'O documento deve possuir um código de série.' } )
            .regex ( /^[0-9]+$/, 'O identificador deve conter apenas números.' )
            .refine ( ( valor ) => valor.length !== 2 || !/^0+$/.test ( valor ), 'O código de série não pode ser preenchido apenas com zeros.' ),
    }
);

export type DocumentoFiscalChave = z.infer < typeof documentoFiscalSchema >;

// Data de emissão — comum a todo documento (compra, nota fiscal e contas).
const campoDataEmissao = z
    .coerce.date ( { message: 'A data de emissão é inválida.' } );

// Datas do documento de entrada (compra e nota fiscal): emissão do documento e chegada da
// mercadoria. A checagem cruzada fica em `ValidarDatasDocumentoFiscal`.
export const datasDocumentoFiscalSchema = z.object
(
    {
        dtEmissao: campoDataEmissao,
        dtChegada: z
            .coerce.date ( { message: 'A data de chegada é inválida.' } ),
    }
);

export type DatasDocumentoFiscal = z.infer < typeof datasDocumentoFiscalSchema >;

/**
 * RN004 — a chegada não pode ser anterior à emissão nem futura (emissão também não).
 * Usar no `superRefine` do schema do documento.
 */
export function ValidarDatasDocumentoFiscal
(
    dados: DatasDocumentoFiscal,
    ctx:   z.RefinementCtx
): void
{
    const agora = new Date();

    if ( dados.dtEmissao >= agora )
    {
        ctx.addIssue
        ( {
            code:    'custom',
            path:    [ 'dtEmissao' ],
            message: 'A data de emissão não pode ser futura.',
        } );
    }

    if ( dados.dtChegada < dados.dtEmissao )
    {
        ctx.addIssue
        ( {
            code:    'custom',
            path:    [ 'dtChegada' ],
            message: 'A data de chegada não pode ser anterior à data de emissão.',
        } );
    }
    else if ( dados.dtChegada > agora )
    {
        ctx.addIssue
        ( {
            code:    'custom',
            path:    [ 'dtChegada' ],
            message: 'A data de chegada não pode ser futura.',
        } );
    }
}

// Data do documento parcelado (contas a pagar/receber): só o vencimento — a conta nasce já
// baixada, então a data da baixa (`dtBaixa`) ocupa o lugar da antiga data de emissão. Não há
// checagem cruzada: o vencimento pode ser anterior à baixa (pagamento em atraso, com juro e multa).
export const vencimentoDocumentoFiscalSchema = z.object
(
    {
        dtVencimento: z
            .coerce.date ( { message: 'A data de vencimento é inválida.' } ),
    }
);

export type VencimentoDocumentoFiscal = z.infer < typeof vencimentoDocumentoFiscalSchema >;
