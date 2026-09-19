import { z } from 'zod';

export const createFornecedorSchema = z.object
(
    {
        codCidade: z
            .number ( {
                message: 'A cidade é obrigatória.'
            } )
            .int()
            .positive(),
        codCondDePag: z
            .number ( {
                message: 'A condição de pagamento é obrigatória.'
            } )
            .int()
            .positive(),
        fornecedor: z
            .string ( {
                message: 'O nome do fornecedor é obrigatório.'
            } )
            .trim()
            .min ( 1, 'O nome do fornecedor é obrigatório.' )
            .max ( 128, 'O nome deve ter no máximo 128 caracteres.' )
            .regex ( /^[^\d]+$/, 'O nome do fornecedor não pode conter números.' ),
        nomeFantasia: z
            .string()
            .trim()
            .max ( 60,  'O nome fantasia deve ter no máximo 60 caracteres.' )
            .optional(),
        tipoPessoa: z
            .enum ( ['FISICA', 'JURIDICA'], {
                message: 'Tipo de pessoa inválido.'
            } ),
        enderecoForn: z
            .string()
            .trim()
            .max ( 150, 'O endereço deve ter no máximo 150 caracteres.' )
            .optional(),
        bairroForn: z
            .string()
            .trim()
            .max ( 100, 'O bairro deve ter no máximo 100 caracteres.' )
            .optional(),
        cepForn: z
            .string ( { message: 'O CEP é obrigatório.' } )
            .trim()
            .length ( 8, 'O CEP deve ter 8 dígitos.' )
            .regex ( /^[0-9]+$/, 'O CEP deve conter apenas números.'),
        foneForn: z
            .string ( { message: 'O telefone é obrigatório.' } )
            .trim()
            .regex ( /^[0-9]{10,15}$/, 'O telefone deve conter apenas números, com DDI/DDD e o número (ex: 5511988887777).'),
        cpfCnpjForn: z
            .string ( { message: 'O CPF/CNPJ é obrigatório.' } )
            .trim()
            .regex ( /^([0-9]{11}|[0-9]{14})$/, 'O CPF/CNPJ deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).'),
        inscEstSubTrib: z
            .string ( { message: 'A inscrição estadual é obrigatória.' } )
            .trim()
            .min ( 1, 'A inscrição estadual é obrigatória.' )
            .max ( 15,  'A inscrição estadual deve ter no máximo 15 caracteres.' ),
    }
);

export const updateFornecedorSchema = createFornecedorSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateFornecedorInput = z.infer < typeof createFornecedorSchema >;
export type UpdateFornecedorInput = z.infer < typeof updateFornecedorSchema >;
