import { z } from 'zod';
import
{
    documentoFiscalSchema,
    datasDocumentoFiscalSchema,
    ValidarDatasDocumentoFiscal,
    type DatasDocumentoFiscal,
} from '../../shared/documento-fiscal/documentoFiscal.schema';

const DECIMAL_2_CASAS = /^[0-9]+\.[0-9]{2}$/;

function CampoDecimal ( rotulo: string )
{
    return z
        .coerce.string ( { message: `${ rotulo } deve ser um valor decimal.` } )
        .regex ( DECIMAL_2_CASAS, `${ rotulo } deve ser um decimal positivo com 2 casas (ex.: 10.00).` );
}

const itemCompraSchema = z.object
(
    {
        codProduto: z
            .coerce.number ( { message: 'O produto do item é obrigatório.' } )
            .int()
            .positive ( 'O produto do item é obrigatório.' ),
        quantidade: z
            .coerce.number ( { message: 'A quantidade deve ser um número inteiro.' } )
            .int ( 'A quantidade deve ser um número inteiro.' )
            .positive ( 'A quantidade deve ser maior que zero.' )
            .max ( 99999, 'A quantidade máxima por item é 99.999.' ),
        valorUnitario: CampoDecimal ( 'O valor unitário' )
            .refine
            (
                ( valor ) => !DECIMAL_2_CASAS.test ( valor ) || Number ( valor ) > 0,
                'O valor unitário deve ser maior que zero.'
            ),
        desconto: CampoDecimal ( 'O desconto' ),
        // RN020 — unidade em que o fornecedor vendeu o produto nesta compra; vale só para
        // o item e nunca é gravada de volta em Produtos.undProduto.
        unidade: z
            .string ( { message: 'A unidade do item é obrigatória.' } )
            .trim()
            .min ( 1, 'A unidade do item é obrigatória.' )
            .max ( 4, 'A unidade deve ter no máximo 4 caracteres.' ),
    }
);

// A prévia dos totais e a geração das parcelas não dependem da unidade do item.
const itemSimulacaoSchema = itemCompraSchema.omit ( { unidade: true } );

export type ItemCompraInput     = z.infer < typeof itemCompraSchema >;
export type ItemSimulacaoInput  = z.infer < typeof itemSimulacaoSchema >;

// RN023 — parcela própria da compra: nasce da condição de pagamento (RN022), mas é
// ajustável só aqui (valor, vencimento, forma de pagamento) e nunca altera a condição.
const parcelaCompraSchema = z.object
(
    {
        numParcela: z
            .coerce.number ( { message: 'O número da parcela é obrigatório.' } )
            .int ( 'O número da parcela deve ser um inteiro.' )
            .positive ( 'O número da parcela deve ser maior que zero.' ),
        codFormaDePag: z
            .coerce.number ( { message: 'A forma de pagamento da parcela é obrigatória.' } )
            .int()
            .positive ( 'A forma de pagamento da parcela é obrigatória.' ),
        valor: CampoDecimal ( 'O valor da parcela' )
            .refine
            (
                ( valor ) => !DECIMAL_2_CASAS.test ( valor ) || Number ( valor ) > 0,
                'O valor da parcela deve ser maior que zero.'
            ),
        dtVencimento: z
            .coerce.date ( { message: 'O vencimento da parcela é inválido.' } ),
    }
);

export type ParcelaCompraInput = z.infer < typeof parcelaCompraSchema >;

/**
 * Regras cruzadas da compra:
 * - RN004: datas do documento (compartilhada com a nota fiscal — `ValidarDatasDocumentoFiscal`);
 * - RN016: desconto só por item, e menor que o valor bruto do item;
 * - um produto aparece uma única vez na compra (PK de "CompraProduto").
 */
function ValidarCompra
(
    dados: DatasDocumentoFiscal & { itens: ItemCompraInput[]; parcelas: ParcelaCompraInput[] },
    ctx:   z.RefinementCtx
): void
{
    ValidarDatasDocumentoFiscal ( dados, ctx );
    ValidarItens ( dados, ctx );
    ValidarParcelas ( dados, ctx );
}

// RN023 — número único por compra e vencimentos estritamente crescentes (na ordem do
// número da parcela) e posteriores à emissão. A soma = vlrTotal é conferida no service,
// onde o total é calculado (o cliente nunca informa o total).
function ValidarParcelas
(
    dados: { dtEmissao: Date; parcelas: ParcelaCompraInput[] },
    ctx:   z.RefinementCtx
): void
{
    const numeros = new Set < number > ( dados.parcelas.map ( ( parcela ) => parcela.numParcela ) );

    if ( numeros.size !== dados.parcelas.length )
    {
        ctx.addIssue
        ( {
            code:    'custom',
            path:    [ 'parcelas' ],
            message: 'Há parcelas com o mesmo número; cada parcela deve ter um número único.',
        } );
        return;
    }

    const ordenadas = [ ...dados.parcelas ].sort ( ( primeira, segunda ) => primeira.numParcela - segunda.numParcela );

    for ( let indice = 0; indice < ordenadas.length; indice++ )
    {
        const anterior = indice === 0 ? dados.dtEmissao : ordenadas[ indice - 1 ].dtVencimento;

        if ( ordenadas[ indice ].dtVencimento <= anterior )
        {
            ctx.addIssue
            ( {
                code:    'custom',
                path:    [ 'parcelas' ],
                message: indice === 0
                    ? 'O vencimento da primeira parcela deve ser posterior à data de emissão.'
                    : 'Os vencimentos devem ser crescentes: cada parcela vence depois da anterior.',
            } );
            return;
        }
    }
}

// RN016 (desconto só por item, menor que o valor bruto) e produto único por compra —
// comum ao cadastro e à simulação dos totais.
function ValidarItens
(
    dados: { itens: ItemSimulacaoInput[] },
    ctx:   z.RefinementCtx
): void
{
    const produtosVistos = new Set < number > ();

    for ( const item of dados.itens )
    {
        if ( produtosVistos.has ( item.codProduto ) )
        {
            ctx.addIssue
            ( {
                code:    'custom',
                path:    [ 'itens' ],
                message: `O produto ${ item.codProduto } aparece mais de uma vez na compra.`,
            } );
            return;
        }

        produtosVistos.add ( item.codProduto );

        const bruto = item.quantidade * Number ( item.valorUnitario );

        if ( Number ( item.desconto ) >= bruto )
        {
            ctx.addIssue
            ( {
                code:    'custom',
                path:    [ 'itens' ],
                message: `O desconto do produto ${ item.codProduto } deve ser menor que o valor do item (quantidade × valor unitário).`,
            } );
            return;
        }
    }
}

// Chave natural da compra: o documento (número, modelo, série) mais o fornecedor.
export const chaveCompraSchema = z.object
(
    {
        ...documentoFiscalSchema.shape,
        codForn: z
            .coerce.number ( { message: 'O fornecedor é obrigatório.' } )
            .int()
            .positive ( 'O fornecedor é obrigatório.' ),
    }
);

export type ChaveCompra = z.infer < typeof chaveCompraSchema >;

const camposCompra = {
    codTransp: z
        .coerce.number ( { message: 'O código da transportadora deve ser um número.' } )
        .int()
        .positive()
        .nullish(),
    codCondDePag: z
        .coerce.number ( { message: 'A condição de pagamento é obrigatória.' } )
        .int()
        .positive ( 'A condição de pagamento é obrigatória.' ),
    ...datasDocumentoFiscalSchema.shape,
    frete:    CampoDecimal ( 'O frete' ),
    seguro:   CampoDecimal ( 'O seguro' ),
    despesas: CampoDecimal ( 'As outras despesas' ),
    itens: z
        .array ( itemCompraSchema, { message: 'Informe os produtos da compra.' } )
        .min ( 1, 'A compra deve ter ao menos um produto.' ),
    parcelas: z
        .array ( parcelaCompraSchema, { message: 'Informe as parcelas da compra.' } )
        .min ( 1, 'A compra deve ter ao menos uma parcela.' ),
};

// Prévia dos totais (POST /api/compras/calculo): só o que entra no cálculo — despesas e
// itens. O formulário a consulta a cada mudança; nenhuma conta é feita no Frontend.
export const simularCompraSchema = z
    .object
    ( {
        frete:    camposCompra.frete,
        seguro:   camposCompra.seguro,
        despesas: camposCompra.despesas,
        itens:    z.array ( itemSimulacaoSchema, { message: 'Informe os produtos da compra.' } ).min ( 1, 'A compra deve ter ao menos um produto.' ),
    } )
    .superRefine ( ValidarItens );

// RN022 — pedido de geração das parcelas: os mesmos dados da prévia dos totais (o total é
// calculado no Backend) mais a condição de pagamento e a emissão que dá base aos vencimentos.
export const gerarParcelasSchema = z
    .object
    ( {
        codCondDePag: camposCompra.codCondDePag,
        dtEmissao:    datasDocumentoFiscalSchema.shape.dtEmissao,
        frete:        camposCompra.frete,
        seguro:       camposCompra.seguro,
        despesas:     camposCompra.despesas,
        itens:        z.array ( itemSimulacaoSchema, { message: 'Informe os produtos da compra.' } ).min ( 1, 'A compra deve ter ao menos um produto.' ),
    } )
    .superRefine ( ValidarItens );

export const createCompraSchema = z
    .object ( { ...chaveCompraSchema.shape, ...camposCompra } )
    .superRefine ( ValidarCompra );

export const cancelarCompraSchema = z.object
(
    {
        justificativaCancelamento: z
            .string ( { message: 'Informe a justificativa do cancelamento.' } )
            .trim()
            .min ( 1, 'Informe a justificativa do cancelamento.' )
            .max ( 255, 'A justificativa deve ter no máximo 255 caracteres.' ),
    }
);

export type SimularCompraInput  = z.infer < typeof simularCompraSchema >;
export type GerarParcelasInput  = z.infer < typeof gerarParcelasSchema >;
export type CreateCompraInput   = z.infer < typeof createCompraSchema >;
export type CabecalhoCompraInput = Omit < CreateCompraInput, keyof ChaveCompra >;
export type CancelarCompraInput = z.infer < typeof cancelarCompraSchema >;
