import { z } from 'zod';

// Item da lista de categorias do produto. A relação Produto ↔ Categoria é N:N
// (associativa "ProdutoCategoria"), então o produto carrega uma lista, não um código só.
const categoriaProdutoSchema = z.object
(
    {
        codCategoria: z
            .coerce.number ( { message: 'A categoria é obrigatória.' } )
            .int()
            .positive ( 'O código da categoria deve ser positivo.' ),
    }
);

/**
 * A PK da associativa é ( codProduto, codCategoria ), então categoria repetida violaria
 * o índice único e voltaria como 23505 cru. A validação acontece aqui, com
 * `path: [ 'categorias' ]` — é `path[0]` que o middleware `Validate` usa como chave em
 * `erros`, e é por ela que o formulário exibe a mensagem.
 */
function validarCategorias
(
    categorias: Array < { codCategoria: number } >,
    ctx:        z.RefinementCtx
): void
{
    const codigosVistos = new Set < number >();

    for ( const item of categorias )
    {
        if ( codigosVistos.has ( item.codCategoria ) )
        {
            ctx.addIssue
            ( {
                code:    'custom',
                path:    [ 'categorias' ],
                message: 'A mesma categoria não pode ser vinculada duas vezes ao produto.',
            } );

            return;
        }

        codigosVistos.add ( item.codCategoria );
    }
}

const camposProduto = {
    produto: z
        .string
        (
            {
                message: 'O nome do produto é obrigatório.'
            }
        )
        .trim()
        .min ( 1, 'Informe o nome do produto.' )
        .max ( 100, 'O nome do produto deve ter no máximo 100 caracteres.' ),

    categorias: z
        .array ( categoriaProdutoSchema )
        .min ( 1, 'O produto deve ter ao menos uma categoria.' ),

    undProduto: z
        .string ( { message: 'A unidade é obrigatória.' } )
        .trim()
        .min ( 1, 'A unidade é obrigatória.' )
        .max ( 4, 'A unidade deve ter no máximo 4 caracteres.' ),

    pesoBruto: z
        .number ( { message: 'O peso bruto é obrigatório.' } )
        .positive ( 'O peso bruto deve ser maior que zero.' ),

    pesoLiq: z
        .number ( { message: 'O peso líquido é obrigatório.' } )
        .positive ( 'O peso líquido deve ser maior que zero.' ),

    estoque: z
        .number ( { message: 'O estoque inicial é obrigatório.' } )
        .int ( 'O estoque deve ser um número inteiro.' )
        .nonnegative ( 'O estoque não pode ser negativo.' )
        .max ( 99999, 'O limite do estoque de produtos são 99.999 unidades.' ),

    // Custo inicial (de referência) — gravado em `custoProd`, nunca em `custoMedioProd`,
    // que só as compras lançadas calculam (custo médio ponderado).
    custoProd: z
        .number ( { message: 'O custo inicial é obrigatório.' } )
        .nonnegative ( 'O custo não pode ser negativo.' ),

    precoVenda: z
        .number ( { message: 'O preço de venda é obrigatório.' } )
        .positive ( 'O preço de venda deve ser maior que zero.' ),
};

export const createProdutoSchema = z
    .object ( camposProduto )
    .superRefine ( ( data, ctx ) => validarCategorias ( data.categorias, ctx ) );

// `estoque` e `custoProd` são definidos no cadastro e imutáveis na edição (RN004);
// `precoVenda` continua editável.
const camposProdutoEdicao = {
    produto:    camposProduto.produto,
    categorias: camposProduto.categorias,
    undProduto: camposProduto.undProduto,
    pesoBruto:  camposProduto.pesoBruto,
    pesoLiq:    camposProduto.pesoLiq,
    precoVenda: camposProduto.precoVenda,
    isActive:   z.boolean(),
};

export const updateProdutoSchema = z
    .object ( camposProdutoEdicao )
    .superRefine ( ( data, ctx ) => validarCategorias ( data.categorias, ctx ) );

export type CreateProdutoInput  = z.infer < typeof createProdutoSchema >;
export type UpdateProdutoInput  = z.infer < typeof updateProdutoSchema >;
export type CategoriaProdutoItem = z.infer < typeof categoriaProdutoSchema >;
