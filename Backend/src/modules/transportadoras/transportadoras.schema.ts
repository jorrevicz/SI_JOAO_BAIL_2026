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
             } ),
        enderecoTransp: z
            .string()
            .trim()
            .max ( 35,  'O endereço deve ter no máximo 35 caracteres.' )
            .optional(),
        cpfCnpjTransp: z
            .string ( { message: 'O CPF/CNPJ é obrigatório.' } )
            .trim()
            .regex ( /^([0-9]{11}|[0-9]{14})$/, 'O CPF/CNPJ deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).'),
        inscEstTransp: z
            .string ( { message: 'A inscrição estadual é obrigatória.' } )
            .trim()
            .min ( 1, 'A inscrição estadual é obrigatória.' )
            .max ( 15,  'A inscrição estadual deve ter no máximo 15 caracteres.' ),
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
