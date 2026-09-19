import { z } from 'zod';

export const createVeiculoSchema = z.object
(
    {
        placaVeiculo: z
            .string ( { 
                message: 'A placa do veículo é obrigatória.' 
            } )
            .trim()
            .min ( 1, 'A placa do veículo é obrigatória.' )
            .max ( 7, 'A placa deve ter no máximo 7 caracteres.' ),
        modeloVeiculo: z
            .string ( { message: 'O modelo do veículo é obrigatório.' } )
            .trim()
            .min ( 1, 'O modelo do veículo é obrigatório.' )
            .max ( 100, 'O modelo deve ter no máximo 100 caracteres.' ),
        marca: z
            .string ( { message: 'A marca é obrigatória.' } )
            .trim()
            .min ( 1, 'A marca é obrigatória.' )
            .max ( 13, 'A marca deve ter no máximo 13 caracteres.' ),
        codEstado: z
            .number()
            .int()
            .positive()
            .optional(),
        placaMercoSul: z
            .string()
            .trim()
            .max ( 7, 'A placa Mercosul deve ter no máximo 7 caracteres.' )
            .optional(),
        codAntt: z
            .string ( { message: 'O código ANTT é obrigatório.' } )
            .trim()
            .min(8, 'O código ANTT deve ter no mínimo 8 dígitos' )
            .max(9, 'O código ANTT deve ter no máximo 9 dígitos.' )
            .regex ( /^[0-9]+$/, 'O código ANTT deve conter apenas números.'),
    }
);

export const updateVeiculoSchema = createVeiculoSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateVeiculoInput = z.infer < typeof createVeiculoSchema >;
export type UpdateVeiculoInput = z.infer < typeof updateVeiculoSchema >;
