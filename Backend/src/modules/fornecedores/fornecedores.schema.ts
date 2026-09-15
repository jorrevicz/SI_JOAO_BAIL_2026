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
            .regex ( /^[^\d]+$/, 'O nome do estado não pode conter números.' ),
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
            .string()
            .trim()
            .max ( 8,   'O CEP deve ter no máximo 8 dígitos.' )
            .regex ( /^[0-9]+$/, 'O CEP deve conter apenas números.')
            .optional(),
        foneForn: z
            .string()
            .trim()
            .max ( 15,  'O telefone deve ter no máximo 15 dígitos.' )
            .regex ( /^[0-9]+$/, 'O telefone deve conter apenas números.')
            .optional(),
        cpfCnpjForn: z
            .string()
            .trim()
            .max ( 14,  'O CPF/CNPJ deve ter no máximo 14 dígitos.' )
            .regex ( /^[0-9]+$/, 'O CPF deve conter apenas números.')
            .optional(),
        inscEstSubTrib: z
            .string()
            .trim()
            .max ( 15,  'A inscrição estadual deve ter no máximo 15 caracteres.' )
            .optional(),
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
