import { z } from 'zod';

export const createFormaPagamentoSchema = z.object
(
    {
        formaDePag: z
            .string()
            .trim()
            .min ( 1, 'Informe a forma de pagamento.' )
            .max ( 50 ),
        prazoCompensacao: z
            .coerce.number ( {
                message: 'O prazo de compensação é obrigatório.'
            } )
            .int ( 'Prazo deve ser um número inteiro.' )
            .nonnegative ( 'Prazo não pode ser negativo.' ),
    }
);

export const updateFormaPagamentoSchema = createFormaPagamentoSchema
    .omit ( { prazoCompensacao: true } )
    .extend
    (
        {
            isActive: z.boolean()
        }
    );
export type CreateFormaPagamentoInput = z.infer < typeof createFormaPagamentoSchema >;
export type UpdateFormaPagamentoInput = z.infer < typeof updateFormaPagamentoSchema >;
