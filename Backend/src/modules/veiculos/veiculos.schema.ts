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
            .string()
            .trim()
            .max ( 100, 'O modelo deve ter no máximo 100 caracteres.' )
            .optional(),
        marca: z
            .string()
            .trim()
            .max ( 13, 'A marca deve ter no máximo 13 caracteres.' )
            .optional(),
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
            .string()
            .trim()
            .min(8, 'O código ANTT deve ter no mínimo 8 dígitos' )
            .max(9, 'O código ANTT deve ter no máximo 9 dígitos.' )
            .regex ( /^[0-9]+$/, 'O código ANTT deve conter apenas números.')
            .optional(),
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
