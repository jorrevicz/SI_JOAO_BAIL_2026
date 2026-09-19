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
            } ),
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
            .string ( { message: 'O CEP é obrigatório.' } )
            .trim()
            .length ( 8, 'O CEP deve ter 8 dígitos.' )
            .regex ( /^[0-9]+$/, 'O CEP deve conter apenas números.')
            .refine ( ( valor ) => valor.length !== 8 || !/^0+$/.test ( valor ), 'O CEP não pode ser preenchido apenas com zeros.' ),
        foneCl: z
            .string ( { message: 'O telefone é obrigatório.' } )
            .trim()
            .regex ( /^[0-9]{10,15}$/, 'O telefone deve conter apenas números, com DDI/DDD e o número (ex: 5511988887777).')
            .refine ( ( valor ) => valor.length < 10 || valor.length > 15 || !/^0+$/.test ( valor ), 'O telefone não pode ser preenchido apenas com zeros.' ),
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
