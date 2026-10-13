import { z } from "zod";
import
{
    documentoFiscalSchema,
    vencimentoDocumentoFiscalSchema,
    ValidarVencimentoDocumentoFiscal,
} from '../../shared/documento-fiscal/documentoFiscal.schema';

// A conta nasce já baixada (valorBaixa e dtBaixa obrigatórios): não há edição nem baixa
// posterior, só o cancelamento.
// Chave natural da conta: o documento (número, modelo, série) mais o fornecedor e a parcela.
export const chaveContaAPagarSchema = z.object
(
    {
        ...documentoFiscalSchema.shape,
        parcela: z
            .coerce.number ( { message: "O código da parcela deve ser um número."})
            .int()
            .positive(),
        codFornecedor: z
            .coerce.number( { message: "O código do fornecedor deve ser um número."})
            .int()
            .positive(),
    }
);

export type ChaveContaAPagar = z.infer < typeof chaveContaAPagarSchema >;

const camposContaAPagar = {
    ...chaveContaAPagarSchema.shape,
    ...vencimentoDocumentoFiscalSchema.shape,
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
        .refine ( ( valor ) => !/^[0-9]+\.[0-9]{2}$/.test ( valor ) || Number ( valor ) > 0, "O valor da baixa deve ser maior que zero." ),
    dtBaixa: z
        .coerce.date ( { message: "A data da baixa é inválida"}),
    isActive: z
        .boolean()
        .default ( true )
};

export const createContasAPagarSchema = z
    .object ( camposContaAPagar )
    .superRefine ( ValidarVencimentoDocumentoFiscal );

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

// Prévia do valor total (valor + juro + multa − desconto): só os campos que entram na conta.
export const calcularTotalContaSchema = z.object
(
    {
        valor:    camposContaAPagar.valor,
        juro:     camposContaAPagar.juro,
        multa:    camposContaAPagar.multa,
        desconto: camposContaAPagar.desconto,
    }
);

export type CreateContasAPAgarInput = z.infer < typeof createContasAPagarSchema >;
export type CancelarContaPagarInput = z.infer < typeof cancelarContaPagarSchema >;