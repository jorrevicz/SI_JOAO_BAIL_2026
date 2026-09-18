import { z } from 'zod';

export const createClienteSchema = z.object
(
    {
        codCidade: z
            .number ( { message: 'A cidade é obrigatória.' } )
            .int()
            .positive(),
        cliente: z
            .string ( { message: 'O nome do cliente é obrigatório.' } )
            .trim()
            .min ( 1, 'O nome do cliente é obrigatório.' )
            .max ( 128, 'O nome deve ter no máximo 128 caracteres.' )
            .regex ( /^[^\d]+$/, 'O nome do cliente não pode conter números.' ),
        tipoPessoa: z
            .enum ( ['FISICA', 'JURIDICA'], {
                message: 'Tipo de pessoa inválido.'
            } )
            .optional(),
        codCondDePag: z
            .number()
            .int()
            .positive()
            .optional(),
        enderecoCl: z
            .string()
            .trim()
            .max ( 150, 'O endereço deve ter no máximo 150 caracteres.' )
            .optional(),
        bairroCl: z
            .string()
            .trim()
            .max ( 100, 'O bairro deve ter no máximo 100 caracteres.' )
            .optional(),
        cepCl: z
            .string()
            .trim()
            .max ( 8,   'O CEP deve ter no máximo 8 dígitos.' )
            .regex ( /^[0-9]+$/, 'O telefone deve conter apenas 15 dígitos (ex: +55545988884444).')
            .optional(),
        foneCl: z
            .string()
            .trim()
            .regex ( /^\+[0-9]{10,15}$/, 'O Telefone deve conter apenas números.')
            .optional(),
    }
);

export const updateClienteSchema = createClienteSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateClienteInput = z.infer < typeof createClienteSchema >;
export type UpdateClienteInput = z.infer < typeof updateClienteSchema >;
