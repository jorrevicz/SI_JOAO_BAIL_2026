import { z } from "zod";
import { documentoFiscalSchema } from '../../shared/documento-fiscal/documentoFiscal.schema';

export const createContasAReceberSchema = z.object
(
    {
        ...documentoFiscalSchema.shape,
        parcela: z
            .coerce.number ( { message: "O código da parcela deve ser um número."})
            .int()
            .positive(),
        codCliente: z
            .coerce.number( { message: "O código do cliente deve ser um número."})
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
            .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da conta deve ser um decimal e positivo." )
            .refine ( ( valor ) => !/^[0-9]+\.[0-9]{2}$/.test ( valor ) || Number ( valor ) > 0, "O valor da conta deve ser maior que zero." ),
        valorBaixa: z
            .coerce.string ( { message: "O valor da baixa deve ser uma string decimal."})
            .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da baixa deve ser um decimal e positivo." )
            .nullish(),
        dtBaixa: z
            .coerce.date ( { message: "A data da baixa é inválida"})
            .nullish(),
        dtPagamento: z
            .coerce.date ( { message: "A data de pagamento é inválida"})
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

export const updateContasAReceberSchema = createContasAReceberSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export const registrarPagamentoRecebidoSchema = z.object
(
    {
        valorBaixa: z
            .coerce.string ( { message: "O valor da baixa deve ser uma string decimal."} )
            .regex ( /^[0-9]+\.[0-9]{2}$/, "O valor da baixa deve ser um decimal e positivo." )
            .refine ( ( valor ) => !/^[0-9]+\.[0-9]{2}$/.test ( valor ) || Number ( valor ) > 0, "O valor da baixa deve ser maior que zero." ),
        dtBaixa: z
            .coerce.date ( { message: "A data da baixa é inválida"} ),
        dtPagamento: z
            .coerce.date ( { message: "A data de pagamento é inválida"} ),
    }
);

export const cancelarContaReceberSchema = z.object
(
    {
        justificativaCancelamento: z
            .string ( { message: "A justificativa deve ser uma string" } )
            .trim()
            .min ( 1, 'Informe a justificativa do cancelamento.' )
            .max ( 255 ),
    }
);

export type CreateContasAReceberInput = z.infer < typeof createContasAReceberSchema >;
export type UpdateContasAReceberInput = z.infer < typeof updateContasAReceberSchema >;
export type RegistrarPagamentoRecebidoInput = z.infer < typeof registrarPagamentoRecebidoSchema >;
export type CancelarContaReceberInput = z.infer < typeof cancelarContaReceberSchema >;
