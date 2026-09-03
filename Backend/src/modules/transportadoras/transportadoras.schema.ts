import { z } from 'zod';

export const createTransportadoraSchema = z.object
(
    {
        codCidade: z
            .number ( { 
                message: 'A cidade é obrigatória.' 
            } )
            .int()
            .positive(),
        transportadora: z
            .string ( { 
                message: 'O nome da transportadora é obrigatório.' 
            } )
            .trim()
            .min ( 1, 'O nome da transportadora é obrigatório.' )
            .max ( 128, 'O nome deve ter no máximo 128 caracteres.' ),
        codVeiculo: z
            .number()
            .int()
            .positive()
            .optional(),
        nomeFantasia: z
            .string()
            .trim()
            .max ( 60,  'O nome fantasia deve ter no máximo 60 caracteres.' )
            .optional(),
        tipoPessoa: z
            .enum ( ['FISICA', 'JURIDICA'], { 
                message: 'Tipo de pessoa inválido.'
             } )
            .optional(),
        enderecoTransp: z
            .string()
            .trim()
            .max ( 35,  'O endereço deve ter no máximo 35 caracteres.' )
            .optional(),
        cpfCnpjTransp: z
            .string()
            .trim()
            .max ( 14,  'O CPF/CNPJ deve ter no máximo 14 dígitos.' )
            .regex ( /^[0-9]+$/, 'O CPF/CNPJ deve conter apenas números.')
            .optional(),
        inscEstTransp: z
            .string()
            .trim()
            .max ( 15,  'A inscrição estadual deve ter no máximo 15 caracteres.' )
            .optional(),
    }
);

export const updateTransportadoraSchema = createTransportadoraSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateTransportadoraInput = z.infer < typeof createTransportadoraSchema >;
export type UpdateTransportadoraInput = z.infer < typeof updateTransportadoraSchema >;
