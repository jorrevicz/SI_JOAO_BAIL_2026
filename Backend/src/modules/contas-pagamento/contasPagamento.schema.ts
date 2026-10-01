import { z } from "zod";
import { documentoFiscalSchema } from '../../shared/documento-fiscal/documentoFiscal.schema';

// RN: o vencimento precisa ser estritamente posterior à emissão — datas e horários
// iguais (ou o vencimento antes) não são permitidos, nem no mesmo dia. Comparação
// cruzada entre campos, por isso vive num superRefine (mesmo padrão de
// validarParcelas em condicoes-pagamento.schema.ts), aplicado tanto no create quanto
// no update.
function validarDatas
(
    dados: { dtEmissao: Date; dtVencimento: Date },
    ctx:   z.RefinementCtx
): void
{
    if ( dados.dtVencimento <= dados.dtEmissao )
    {
        ctx.addIssue
        ( {
            code:    'custom',
            path:    [ 'dtVencimento' ],
            message: 'A data de vencimento não pode ser igual ou anterior à data de emissão.',
        } );
    }
}

const camposContaAPagar = {
    ...documentoFiscalSchema.shape,
    parcela: z
        .coerce.number ( { message: "O código da parcela deve ser um número."})
        .int()
        .positive(),
    codFornecedor: z
        .coerce.number( { message: "O código do fornecedor deve ser um número."})
        .int()
        .positive(),
    dtVencimento: z
        .coerce.date ( { message: "A data de vencimento é inválida"}),
    dtEmissao: z
        .coerce.date ( { message: "A data de emissão é inválida"}),
    codFormaDePag: z
        .coerce.number ( { message: "O código da forma de pagamento deve ser um número."})
        .int()
        .positive(),
    juro: z
        .coerce.string ( { message: "O valor do juro deve ser uma string decimal."})
        .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor do juro deve ser um decimal e positivo." ),
    desconto: z
        .coerce.string ( { message: "O valor do desconto deve ser uma string decimal."})
        .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor do desconto deve ser um decimal e positivo." ),
    multa: z
        .coerce.string ( { message: "O valor da multa deve ser uma string decimal."})
        .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da multa deve ser um decimal e positivo." ),
    valor: z
        .coerce.string ( { message: "O valor da conta deve ser uma string decimal."})
        .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da conta deve ser um decimal e positivo." )
        .refine ( ( valor ) => !/^[0-9]+\.[0-9]{2}$/.test ( valor ) || Number ( valor ) > 0, "O valor da conta deve ser maior que zero." ),
    valorBaixa: z
        .coerce.string ( { message: "O valor da baixa deve ser uma string decimal."})
        .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da baixa deve ser um decimal e positivo." )
        .nullish(),
    dtBaixa: z
        .coerce.date ( { message: "A data da baixa é inválida"})
        .nullish(),
    justificativaCancelamento: z
        .coerce.string ( { message: "A justificativa deve ser uma string" } )
        .max ( 255 )
        .nullish(),
    isActive: z
        .boolean()
        .default ( true )
};

export const createContasAPagarSchema = z
    .object ( camposContaAPagar )
    .superRefine ( validarDatas );

const camposContaAPagarEdicao = {
    ...camposContaAPagar,
    isActive: z.boolean()
};

export const updateContasaPagarSchema = z
    .object ( camposContaAPagarEdicao )
    .superRefine ( validarDatas );

export const registrarBaixaContaPagarSchema = z.object
(
    {
        valorBaixa: z
            .coerce.string ( { message: "O valor da baixa deve ser uma string decimal."} )
            .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da baixa deve ser um decimal e positivo." )
            .refine ( ( valor ) => !/^[0-9]+\.[0-9]{2}$/.test ( valor ) || Number ( valor ) > 0, "O valor da baixa deve ser maior que zero." ),
        dtBaixa: z
            .coerce.date ( { message: "A data da baixa é inválida"} ),
    }
);

export const cancelarContaPagarSchema = z.object
(
    {
        justificativaCancelamento: z
            .string ( { message: "A justificativa deve ser uma string" } )
            .trim()
            .min ( 1, 'Informe a justificativa do cancelamento.' )
            .max ( 255 ),
    }
);

export type CreateContasAPAgarInput = z.infer < typeof createContasAPagarSchema >;
export type UpdateContasAPagarInput = z.infer < typeof updateContasaPagarSchema >;
export type RegistrarBaixaContaPagarInput = z.infer < typeof registrarBaixaContaPagarSchema >;
export type CancelarContaPagarInput = z.infer < typeof cancelarContaPagarSchema >;