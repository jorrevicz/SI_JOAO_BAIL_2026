import { z } from "zod";
import { documentoFiscalSchema } from '../../shared/documento-fiscal/documentoFiscal.schema';

export const createContasAPagarSchema = z.object
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
        dtVencimento: z
            .coerce.date ( { message: "A data de vencimento é inválida"})
            .optional(),
        dtEmissao: z
            .coerce.date ( { message: "A data de emissão é inválida"})
            .optional(),
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
            .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da conta deve ser um decimal e positivo." ),
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
    }
);

export const updateContasaPagarSchema = createContasAPagarSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export const registrarBaixaContaPagarSchema = z.object
(
    {
        valorBaixa: z
            .coerce.string ( { message: "O valor da baixa deve ser uma string decimal."} )
            .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da baixa deve ser um decimal e positivo." ),
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