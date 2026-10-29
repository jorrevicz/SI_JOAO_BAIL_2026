import { z } from 'zod';
import { documentoFiscalSchema } from '../../shared/documento-fiscal/documentoFiscal.schema';

const DECIMAL_2_CASAS = /^[0-9]+\.[0-9]{2}$/;

// CSOSN — Código de Situação da Operação no Simples Nacional (ver docs/10-glossario.md).
export const CSOSN_VALIDOS = [ '101', '102', '103', '201', '202', '203', '300', '400', '500', '900' ] as const;

// Modalidade do frete da NF-e (campo `modFrete` do leiaute).
export const FRETE_POR_CONTA = [
    'Emitente',
    'Destinatário',
    'Terceiros',
    'Próprio remetente',
    'Próprio destinatário',
    'Sem frete',
] as const;

function CampoAliquota ( rotulo: string )
{
    return z
        .coerce.string ( { message: `${ rotulo } deve ser um valor decimal.` } )
        .regex ( DECIMAL_2_CASAS, `${ rotulo } deve ser um decimal com 2 casas (ex.: 18.00).` )
        .refine ( ( valor ) => Number ( valor ) <= 100, `${ rotulo } deve estar entre 0.00 e 100.00.` );
}

// Chave da NF-e = chave da compra de origem: documento (número, modelo, série) + fornecedor.
export const chaveNotaFiscalSchema = z.object
(
    {
        ...documentoFiscalSchema.shape,
        codFornecedor: z
            .coerce.number ( { message: 'O fornecedor é obrigatório.' } )
            .int()
            .positive ( 'O fornecedor é obrigatório.' ),
    }
);

// Tributação informada por item; quantidade, valor unitário e desconto vêm da compra.
const itemNotaFiscalSchema = z.object
(
    {
        codProduto: z
            .coerce.number ( { message: 'O produto do item é obrigatório.' } )
            .int()
            .positive ( 'O produto do item é obrigatório.' ),
        // CFOP de entrada: começa com 1 (estadual), 2 (interestadual) ou 3 (exterior).
        cfop: z
            .string ( { message: 'Informe o CFOP do item.' } )
            .regex ( /^[123][0-9]{3}$/, 'O CFOP do item deve ter 4 dígitos e ser de entrada (iniciar com 1, 2 ou 3).' ),
        csosn: z
            .enum ( CSOSN_VALIDOS, { message: `O CSOSN do item deve ser um destes: ${ CSOSN_VALIDOS.join ( ', ' ) }.` } ),
        aliqIcms: CampoAliquota ( 'A alíquota de ICMS' ),
        aliqIpi:  CampoAliquota ( 'A alíquota de IPI' ),
    }
);

export type ItemNotaFiscalInput = z.infer < typeof itemNotaFiscalSchema >;

const camposItens = {
    itens: z
        .array ( itemNotaFiscalSchema, { message: 'Informe a tributação dos produtos da nota.' } )
        .min ( 1, 'A nota fiscal deve ter ao menos um produto.' ),
};

// Um produto aparece uma única vez na nota (PK de "ProdutoNfe").
function ValidarItensUnicos
(
    dados: { itens: ItemNotaFiscalInput[] },
    ctx:   z.RefinementCtx
): void
{
    const produtos = new Set ( dados.itens.map ( ( item ) => item.codProduto ) );

    if ( produtos.size !== dados.itens.length )
    {
        ctx.addIssue ( { code: 'custom', path: [ 'itens' ], message: 'Há produtos repetidos na nota fiscal.' } );
    }
}

/**
 * Dígito verificador da chave de acesso (módulo 11): pesos 2 a 9, da direita para a
 * esquerda, sobre os 43 primeiros dígitos; resto 0 ou 1 dá dígito 0.
 */
export function DigitoVerificadorChaveAcesso ( chaveSemDigito: string ): number
{
    let soma = 0;
    let peso = 2;

    for ( let indice = chaveSemDigito.length - 1; indice >= 0; indice-- )
    {
        soma += Number ( chaveSemDigito[ indice ] ) * peso;
        peso  = peso === 9 ? 2 : peso + 1;
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
}

/**
 * Regras cruzadas da geração:
 * - a chave de acesso tem dígito verificador válido e traz o modelo (posições 21–22), a
 *   série (23–25) e o número (26–34) do documento da compra;
 * - a emissão não é futura e a saída, se informada, não é anterior à emissão;
 * - produto único por nota.
 */
function ValidarGeracao
(
    dados: z.infer < typeof camposGeracao > & { numero: string; modelo: string; serie: string },
    ctx:   z.RefinementCtx
): void
{
    const chave = dados.chaveAcessoNfe;

    if ( /^[0-9]{44}$/.test ( chave ) )
    {
        if ( DigitoVerificadorChaveAcesso ( chave.slice ( 0, 43 ) ) !== Number ( chave[ 43 ] ) )
        {
            ctx.addIssue ( { code: 'custom', path: [ 'chaveAcessoNfe' ], message: 'O dígito verificador da chave de acesso é inválido.' } );
        }
        else if
        (
            chave.slice ( 20, 22 ) !== dados.modelo
            || chave.slice ( 22, 25 ) !== dados.serie.padStart ( 3, '0' )
            || chave.slice ( 25, 34 ) !== dados.numero
        )
        {
            ctx.addIssue
            ( {
                code:    'custom',
                path:    [ 'chaveAcessoNfe' ],
                message: 'A chave de acesso não corresponde ao modelo, à série e ao número do documento da compra.',
            } );
        }
    }

    if ( dados.dhEmiNfe > new Date() )
    {
        ctx.addIssue ( { code: 'custom', path: [ 'dhEmiNfe' ], message: 'A data de emissão da nota não pode ser futura.' } );
    }

    if ( dados.dhSaiNfe && dados.dhSaiNfe < dados.dhEmiNfe )
    {
        ctx.addIssue ( { code: 'custom', path: [ 'dhSaiNfe' ], message: 'A data de saída não pode ser anterior à data de emissão.' } );
    }

    ValidarItensUnicos ( dados, ctx );
}

const camposGeracao = z.object
(
    {
        chaveAcessoNfe: z
            .string ( { message: 'Informe a chave de acesso da nota.' } )
            .regex ( /^[0-9]{44}$/, 'A chave de acesso deve ter exatamente 44 dígitos.' ),
        dhEmiNfe: z
            .coerce.date ( { message: 'A data de emissão da nota é inválida.' } ),
        dhSaiNfe: z
            .coerce.date ( { message: 'A data de saída da nota é inválida.' } )
            .nullish(),
        fretePorConta: z
            .enum ( FRETE_POR_CONTA, { message: `O frete por conta deve ser um destes: ${ FRETE_POR_CONTA.join ( ', ' ) }.` } ),
        infoCompl: z
            .string()
            .trim()
            .max ( 2000, 'As informações complementares devem ter no máximo 2000 caracteres.' )
            .nullish(),
        ...camposItens,
    }
);

// Prévia dos impostos e totais (POST /api/notas-fiscais/calculo): a compra de origem e a
// tributação por item. Nada é gravado.
export const calcularNotaFiscalSchema = z
    .object ( { ...chaveNotaFiscalSchema.shape, ...camposItens } )
    .superRefine ( ValidarItensUnicos );

export const gerarNotaFiscalSchema = z
    .object ( { ...chaveNotaFiscalSchema.shape, ...camposGeracao.shape } )
    .superRefine ( ValidarGeracao );

export const cancelarNotaFiscalSchema = z.object
(
    {
        justificativaCancelamento: z
            .string ( { message: 'Informe a justificativa do cancelamento.' } )
            .trim()
            .min ( 1, 'Informe a justificativa do cancelamento.' )
            .max ( 255, 'A justificativa deve ter no máximo 255 caracteres.' ),
    }
);

export type CalcularNotaFiscalInput = z.infer < typeof calcularNotaFiscalSchema >;
export type GerarNotaFiscalInput    = z.infer < typeof gerarNotaFiscalSchema >;
