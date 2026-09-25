import { z } from 'zod';

export const createServicoSchema = z.object
(
    {
        servico: z
            .string ( { message: 'O nome do serviço é obrigatório.' } )
            .trim()
            .min ( 1, 'Informe o nome do serviço.' )
            .max ( 80, 'O nome do serviço deve ter no máximo 80 caracteres.' ),
        valor: z
            .coerce.string ( { message: 'O valor do serviço deve ser uma string decimal.' } )
            .regex ( /^[0-9]+\.[0-9]{2}$/, 'O valor do serviço deve ser um decimal (ex: 150.00).' )
            .refine ( ( valor ) => Number ( valor ) > 0, 'O valor do serviço deve ser maior que zero.' ),
        codFuncionario: z
            .coerce.number ( { message: 'O funcionário responsável é obrigatório.' } )
            .int()
            .positive(),
    }
);

export const updateServicoSchema = createServicoSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateServicoInput = z.infer < typeof createServicoSchema >;
export type UpdateServicoInput = z.infer < typeof updateServicoSchema >;
