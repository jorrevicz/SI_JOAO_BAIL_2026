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

/**
 * Estrutura da checklist de uma OS: só define QUAIS procedimentos entram e em que
 * ORDEM (RN009). Não carrega dados de checagem — quem preenche isso é
 * `registrarDiagnosticoOS()`, sobre uma linha já existente.
 */
export const procedimentoEstruturaOdSSchema = z.object
(
    {
        codProcedimento: z
            .coerce.number ( { message: 'O procedimento é obrigatório.' } )
            .int()
            .positive(),
        ordem: z
            .coerce.number ( { message: 'A ordem é obrigatória.' } )
            .int()
            .positive(),
    }
);

export const definirProcedimentosSchema = z.object
(
    {
        procedimentos: z
            .array ( procedimentoEstruturaOdSSchema )
            .default ( [] )
            .refine
            (
                ( itens ) => new Set ( itens.map ( ( item ) => item.codProcedimento ) ).size === itens.length,
                'A lista de procedimentos não pode repetir o mesmo procedimento.'
            )
            .refine
            (
                ( itens ) => new Set ( itens.map ( ( item ) => item.ordem ) ).size === itens.length,
                'A lista de procedimentos não pode repetir a mesma ordem.'
            ),
    }
);

/**
 * Checagem de um procedimento já presente na checklist da OS (RN009/RN010) —
 * preenchida no diagnóstico, nunca adiciona nem remove itens da lista.
 */
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
            .boolean ( { message: 'A checagem é obrigatória.' } ),
        dthFim: z
            .coerce.date ( { message: 'A data/hora da checagem é obrigatória.' } ),
        obsProcedimento: z
            .string()
            .trim()
            .max ( 244 )
            .nullish(),
    }
)
.refine
(
    ( item ) => item.checagem === true || ( item.obsProcedimento?.trim().length ?? 0 ) > 0,
    {
        message: 'Observação é obrigatória quando a checagem não é confirmada.',
        path: [ 'obsProcedimento' ],
    }
);

export const abrirOrdemServicoSchema = z.object
(
    {
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

export const orcamentoPecaOdSSchema = z.object
(
    {
        codPeca: z
            .coerce.number ( { message: 'A peça é obrigatória.' } )
            .int()
            .positive(),
        vlrPv: z
            .coerce.string ( { message: 'O valor de venda deve ser uma string decimal.' } )
            .regex ( /^[0-9]+\.[0-9]{2}$/, 'O valor de venda deve ser um decimal (ex: 89.90).' )
            .refine ( ( valor ) => Number ( valor ) > 0, 'O valor de venda deve ser maior que zero.' ),
    }
);

export const registrarDiagnosticoSchema = z.object
(
    {
        historicoManutencao: z
            .string()
            .trim()
            .max ( 2000 )
            .nullish(),
        procedimentos: z
            .array ( procedimentoOdSSchema )
            .default ( [] ),
        orcamentoPecas: z
            .array ( orcamentoPecaOdSSchema )
            .default ( [] ),
    }
);

export const servicoOdSSchema = z.object
(
    {
        codServico: z
            .coerce.number ( { message: 'O serviço é obrigatório.' } )
            .int()
            .positive(),
        qtdServico: z
            .coerce.number ( { message: 'A quantidade é obrigatória.' } )
            .int()
            .positive ( 'A quantidade deve ser maior que zero.' ),
    }
);

export const registrarExecucaoSchema = z.object
(
    {
        servicos: z
            .array ( servicoOdSSchema )
            .default ( [] ),
        obsTecnica: z
            .string()
            .trim()
            .max ( 244 )
            .nullish(),
    }
);

export const substituirPecaOdSSchema = z.object
(
    {
        codPeca: z
            .coerce.number ( { message: 'A peça é obrigatória.' } )
            .int()
            .positive(),
        qtdPeca: z
            .coerce.number ( { message: 'A quantidade é obrigatória.' } )
            .int()
            .positive ( 'A quantidade deve ser maior que zero.' ),
        vlrUnitarioPeca: z
            .coerce.number ( { message: 'O valor unitário é obrigatório.' } )
            .positive ( 'O valor unitário deve ser maior que zero.' ),
    }
);

export const registrarSubstituicaoPecasSchema = z.object
(
    {
        pecas: z
            .array ( substituirPecaOdSSchema )
            .default ( [] ),
    }
);

export type AbrirOrdemServicoInput    = z.infer < typeof abrirOrdemServicoSchema >;
export type RegistrarDiagnosticoInput = z.infer < typeof registrarDiagnosticoSchema >;
export type ProcedimentoOdSItem       = z.infer < typeof procedimentoOdSSchema >;
export type DefinirProcedimentosInput   = z.infer < typeof definirProcedimentosSchema >;
export type ProcedimentoEstruturaOdSItem = z.infer < typeof procedimentoEstruturaOdSSchema >;
export type RegistrarExecucaoInput    = z.infer < typeof registrarExecucaoSchema >;
export type ServicoOdSItem            = z.infer < typeof servicoOdSSchema >;
export type OrcamentoPecaOdSItem      = z.infer < typeof orcamentoPecaOdSSchema >;
export type RegistrarSubstituicaoPecasInput = z.infer < typeof registrarSubstituicaoPecasSchema >;
export type SubstituirPecaOdSItem     = z.infer < typeof substituirPecaOdSSchema >;
