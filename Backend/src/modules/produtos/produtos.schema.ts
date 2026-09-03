import { z } from 'zod';

export const createProdutoSchema = z.object
(
    {
        produto: z
            .string
            (
                {
                    message: 'O nome do produto é obrigatório.'
                }
            )
            .trim()
            .min ( 1, 'Informe o nome do produto.' )
            .max ( 100, 'O nome do produto deve ter no máximo 100 caracteres.' ),

        codCategoria: z
            .number
            (
                {
                    message: 'O código da categoria deve ser um número.'
                }
            )
            .int()
            .positive ( 'O código da categoria deve ser positivo.' )
            .optional(),

        undProduto: z
            .string()
            .trim()
            .max ( 4, 'A unidade deve ter no máximo 4 caracteres.' )
            .optional(),

        pesoBruto: z
            .number()
            .nonnegative ( 'O peso bruto não pode ser negativo.' )
            .optional(),

        pesoLiq: z
            .number()
            .nonnegative ( 'O peso líquido não pode ser negativo.' )
            .optional(),

        estoque: z
            .number()
            .int ( 'O estoque deve ser um número inteiro.' )
            .nonnegative ( 'O estoque não pode ser negativo.' )
            .max ( 99999, 'O limite do estoque de produtos são 99.999 unidades.' )
            .optional(),

        custo: z
            .number()
            .nonnegative ( 'O custo não pode ser negativo.' )
            .optional(),
    }
);

export const updateProdutoSchema = createProdutoSchema
    .omit ( { estoque: true, custo: true } )
    .extend
    (
        {
            isActive: z.boolean()
        }
    );

export type CreateProdutoInput = z.infer < typeof createProdutoSchema >;
export type UpdateProdutoInput = z.infer < typeof updateProdutoSchema >;
