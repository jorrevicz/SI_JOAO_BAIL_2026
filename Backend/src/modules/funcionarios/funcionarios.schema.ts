import { z } from 'zod';

export const createFuncionarioSchema = z.object
(
    {
        codCidade: z
            .coerce.number ( { message: 'A cidade é obrigatória.' } )
            .int()
            .positive(),
        codCargo: z
            .coerce.number ( { message: 'O cargo é obrigatório.' } )
            .int()
            .positive(),
        funcionario: z
            .string ( { message: 'O nome do funcionário é obrigatório.' } )
            .trim()
            .min ( 1, 'Informe o nome do funcionário.' )
            .max ( 128, 'O nome do funcionário deve ter no máximo 128 caracteres.' ),
        funcFone: z
            .string ( { message: 'O telefone é obrigatório.' } )
            .trim()
            .regex ( /^[0-9]{10,15}$/, 'O telefone deve conter apenas números, com DDI/DDD e o número (ex: 5511988887777).' )
            .refine ( ( valor ) => valor.length < 10 || valor.length > 15 || !/^0+$/.test ( valor ), 'O telefone não pode ser preenchido apenas com zeros.' ),
    }
);

export const updateFuncionarioSchema = createFuncionarioSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateFuncionarioInput = z.infer < typeof createFuncionarioSchema >;
export type UpdateFuncionarioInput = z.infer < typeof updateFuncionarioSchema >;
