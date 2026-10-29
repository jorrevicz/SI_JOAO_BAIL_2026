import { z } from 'zod';
import { camposDadosPessoais, limparCamposDoOutroTipo } from '../../shared/validation/dadosPessoais.schema';

const camposFornecedor =
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
    tipoPessoa: z
        .enum ( ['FISICA', 'JURIDICA'], {
            message: 'Tipo de pessoa inválido.'
        } ),
    enderecoForn: z
        .string()
        .trim()
        .max ( 150, 'O endereço deve ter no máximo 150 caracteres.' )
        .optional(),
    // Número residencial do endereço — opcional como o próprio endereço.
    numeroForn: z
        .number ( { message: 'O número deve ser numérico.' } )
        .int ( 'O número deve ser inteiro.' )
        .positive ( 'O número deve ser maior que zero.' )
        .max ( 999999, 'O número deve ter no máximo 6 dígitos.' )
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
        .regex ( /^[0-9]+$/, 'O CEP deve conter apenas números.')
        .refine ( ( valor ) => valor.length !== 8 || !/^0+$/.test ( valor ), 'O CEP não pode ser preenchido apenas com zeros.' ),
    foneForn: z
        .string ( { message: 'O telefone é obrigatório.' } )
        .trim()
        .regex ( /^[0-9]{10,15}$/, 'O telefone deve conter apenas números, com DDI/DDD e o número (ex: 5511988887777).')
        .refine ( ( valor ) => valor.length < 10 || valor.length > 15 || !/^0+$/.test ( valor ), 'O telefone não pode ser preenchido apenas com zeros.' ),
    cpfCnpjForn: z
        .string ( { message: 'O CPF/CNPJ é obrigatório.' } )
        .trim()
        .regex ( /^([0-9]{11}|[0-9]{14})$/, 'O CPF/CNPJ deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).')
        .refine ( ( valor ) => ! ( valor.length === 11 || valor.length === 14 ) || !/^0+$/.test ( valor ), 'O CPF/CNPJ não pode ser preenchido apenas com zeros.' ),
    inscEstSubTrib: z
        .string ( { message: 'A inscrição estadual é obrigatória.' } )
        .trim()
        .min ( 1, 'A inscrição estadual é obrigatória.' )
        .max ( 15,  'A inscrição estadual deve ter no máximo 15 caracteres.' ),
    ...camposDadosPessoais,
};

export const createFornecedorSchema = z
    .object ( camposFornecedor )
    .transform ( limparCamposDoOutroTipo );

export const updateFornecedorSchema = z
    .object ( { ...camposFornecedor, isActive: z.boolean() } )
    .transform ( limparCamposDoOutroTipo );

export type CreateFornecedorInput = z.infer < typeof createFornecedorSchema >;
export type UpdateFornecedorInput = z.infer < typeof updateFornecedorSchema >;
