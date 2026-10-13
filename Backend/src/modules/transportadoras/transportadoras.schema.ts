import { z } from 'zod';
import { camposDadosPessoais, validarDadosPessoais, limparCamposDoOutroTipo } from '../../shared/validation/dadosPessoais.schema';

const camposTransportadora =
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
            .regex ( /^([0-9]{11}|[0-9]{14})$/, 'O CPF/CNPJ deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).')
            .refine ( ( valor ) => ! ( valor.length === 11 || valor.length === 14 ) || !/^0+$/.test ( valor ), 'O CPF/CNPJ não pode ser preenchido apenas com zeros.' ),
        inscEstTransp: z
            .string ( { message: 'A inscrição estadual é obrigatória.' } )
            .trim()
            .min ( 1, 'A inscrição estadual é obrigatória.' )
            .max ( 15,  'A inscrição estadual deve ter no máximo 15 caracteres.' ),
        bairroTransp: z
            .string()
            .trim()
            .max ( 100, 'O bairro deve ter no máximo 100 caracteres.' )
            .optional(),
        cepTransp: z
            .string ( { message: 'O CEP é obrigatório.' } )
            .trim()
            .length ( 8, 'O CEP deve ter 8 dígitos.' )
            .regex ( /^[0-9]+$/, 'O CEP deve conter apenas números.')
            .refine ( ( valor ) => valor.length !== 8 || !/^0+$/.test ( valor ), 'O CEP não pode ser preenchido apenas com zeros.' ),
        foneTransp: z
            .string ( { message: 'O telefone é obrigatório.' } )
            .trim()
            .regex ( /^[0-9]{10,15}$/, 'O telefone deve conter apenas números, com DDI/DDD e o número (ex: 5511988887777).')
            .refine ( ( valor ) => valor.length < 10 || valor.length > 15 || !/^0+$/.test ( valor ), 'O telefone não pode ser preenchido apenas com zeros.' ),
        ...camposDadosPessoais,
    };

export const createTransportadoraSchema = z
    .object ( camposTransportadora )
    .superRefine ( validarDadosPessoais )
    .transform ( limparCamposDoOutroTipo );

export const updateTransportadoraSchema = z
    .object ( { ...camposTransportadora, isActive: z.boolean() } )
    .superRefine ( validarDadosPessoais )
    .transform ( limparCamposDoOutroTipo );

export type CreateTransportadoraInput = z.infer < typeof createTransportadoraSchema >;
export type UpdateTransportadoraInput = z.infer < typeof updateTransportadoraSchema >;
