import { z } from 'zod';

export const createProdutoCategoriaSchema = z.object
(
    {
        codProduto: z
            .coerce.number ( { message: 'O produto é obrigatório.' } )
            .int()
            .positive(),
        codCategoria: z
            .coerce.number ( { message: 'A categoria é obrigatória.' } )
            .int()
            .positive(),
    }
);

export type CreateProdutoCategoriaInput = z.infer < typeof createProdutoCategoriaSchema >;
