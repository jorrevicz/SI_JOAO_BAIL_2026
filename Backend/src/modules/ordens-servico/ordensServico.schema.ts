import { z } from 'zod';

const aparelhoSchema = z.object
(
    {
        aparelho: z
            .string()
            .trim()
            .max ( 80, 'O nome do aparelho deve ter no máximo 80 caracteres.' )
            .nullish(),
        serie: z
            .string()
            .trim()
            .max ( 25, 'A série deve ter no máximo 25 caracteres.' )
            .nullish(),
        modelo: z
            .string ( { message: 'O modelo do aparelho é obrigatório.' } )
            .trim()
            .min ( 1, 'Informe o modelo do aparelho.' )
            .max ( 50, 'O modelo deve ter no máximo 50 caracteres.' ),
        voltagem: z
            .string ( { message: 'A voltagem é obrigatória.' } )
            .trim()
            .min ( 1, 'Informe a voltagem.' )
            .max ( 6, 'A voltagem deve ter no máximo 6 caracteres.' ),
        garantia: z
            .string ( { message: 'A garantia é obrigatória.' } )
            .trim()
            .min ( 1, 'Informe a garantia.' )
            .max ( 20, 'A garantia deve ter no máximo 20 caracteres.' ),
    }
);

const equipamentoSchema = z.object
(
    {
        equipamento: z
            .string ( { message: 'A descrição do equipamento é obrigatória.' } )
            .trim()
            .min ( 1, 'Informe a descrição do equipamento.' )
            .max ( 80 ),
        grupoUser: z
            .string()
            .trim()
            .max ( 40 )
            .nullish(),
        soEq: z
            .string ( { message: 'O sistema operacional é obrigatório.' } )
            .trim()
            .min ( 1 )
            .max ( 8 ),
        socketEq: z
            .string ( { message: 'O socket é obrigatório.' } )
            .trim()
            .min ( 1 )
            .max ( 15 ),
        memoriaRam: z
            .string ( { message: 'A memória RAM é obrigatória.' } )
            .trim()
            .min ( 1 )
            .max ( 15 ),
        tipoOffice: z
            .string ( { message: 'O tipo de Office é obrigatório.' } )
            .trim()
            .min ( 1 )
            .max ( 15 ),
        placaMae: z
            .string ( { message: 'A placa-mãe é obrigatória.' } )
            .trim()
            .min ( 1 )
            .max ( 20 ),
        bios: z
            .string ( { message: 'A BIOS é obrigatória.' } )
            .trim()
            .min ( 1 )
            .max ( 15 ),
        capacidadeRam: z
            .string ( { message: 'A capacidade de RAM é obrigatória.' } )
            .trim()
            .min ( 1 )
            .max ( 10 ),
        possuiSSD: z
            .boolean()
            .default ( false ),
        possuiHD: z
            .boolean()
            .default ( false ),
        capacidadeArmz: z
            .string ( { message: 'A capacidade de armazenamento é obrigatória.' } )
            .trim()
            .min ( 1 )
            .max ( 8 ),
        usoArmz: z
            .string ( { message: 'O uso de armazenamento é obrigatório.' } )
            .trim()
            .min ( 1 )
            .max ( 8 ),
    }
);

export const procedimentoOdSSchema = z.object
(
    {
        codProcedimento: z
            .coerce.number ( { message: 'O procedimento é obrigatório.' } )
            .int()
            .positive(),
        posicao: z
            .string ( { message: 'A posição é obrigatória.' } )
            .trim()
            .min ( 1, 'Informe a posição.' )
            .max ( 8, 'A posição deve ter no máximo 8 caracteres.' ),
        checagem: z
            .string ( { message: 'A checagem é obrigatória.' } )
            .trim()
            .min ( 1, 'Informe o resultado da checagem.' )
            .max ( 8, 'A checagem deve ter no máximo 8 caracteres.' ),
        obsProcedimento: z
            .string()
            .trim()
            .max ( 244 )
            .nullish(),
        dthFim: z
            .coerce.date ( { message: 'A data/hora da checagem é inválida.' } )
            .optional(),
    }
);

export const abrirOrdemServicoSchema = z.object
(
    {
        numOdS: z
            .string ( { message: 'O número da OS é obrigatório.' } )
            .trim()
            .length ( 8, 'O número da OS deve ter 8 caracteres.' ),
        codCliente: z
            .coerce.number ( { message: 'O cliente é obrigatório.' } )
            .int()
            .positive(),
        atendente: z
            .string ( { message: 'O atendente é obrigatório.' } )
            .trim()
            .min ( 1, 'Informe o atendente.' )
            .max ( 128 ),
        acessorio: z
            .string()
            .trim()
            .max ( 80 )
            .nullish(),
        defeito: z
            .string ( { message: 'O defeito relatado é obrigatório.' } )
            .trim()
            .min ( 1, 'Informe o defeito relatado.' )
            .max ( 80 ),
        obsBalcao: z
            .string()
            .trim()
            .max ( 244 )
            .nullish(),
        tipoOdS: z
            .string ( { message: 'O tipo da OS é obrigatório.' } )
            .trim()
            .min ( 1, 'Informe o tipo da OS.' )
            .max ( 14 ),
        solicitante: z
            .string()
            .trim()
            .max ( 128 )
            .nullish(),
        aparelho:    aparelhoSchema,
        equipamento: equipamentoSchema,
    }
);

export const registrarDiagnosticoSchema = z.object
(
    {
        obsTecnica: z
            .string()
            .trim()
            .max ( 244 )
            .nullish(),
        historicoManutencao: z
            .string()
            .trim()
            .max ( 2000 )
            .nullish(),
        procedimentos: z
            .array ( procedimentoOdSSchema )
            .default ( [] ),
    }
);

export type AbrirOrdemServicoInput   = z.infer < typeof abrirOrdemServicoSchema >;
export type RegistrarDiagnosticoInput = z.infer < typeof registrarDiagnosticoSchema >;
export type ProcedimentoOdSItem      = z.infer < typeof procedimentoOdSSchema >;
