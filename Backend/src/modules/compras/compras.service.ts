import type postgres from 'postgres';
import { AppError } from '../../shared/errors/AppError';
import { WithTransaction } from '../../shared/transaction/withTransaction';
import { ValidarDocumentoFiscalInexistente } from '../../shared/documento-fiscal/documentoFiscal.service';
import { FornecedoresRepository } from '../fornecedores/fornecedores.repository';
import { TransportadorasRepository } from '../transportadoras/transportadoras.repository';
import { CondicoesPagamentoRepository } from '../condicoes-pagamento/condicoesPagamento.repository';
import { ProdutosRepository } from '../produtos/produtos.repository';
import { ParcelasRepository } from '../parcelas/parcelas.repository';
import { FormasPagamentoRepository } from '../formas-pagamento/formasPagamento.repository';
import type Produtos from '../../db/types/public/Produtos';
import { ComprasRepository } from './compras.repository';
import type { CompraId, CompraDetalhe, CompraItem } from './compras.repository';
import type { CreateCompraInput, CabecalhoCompraInput, SimularCompraInput, GerarParcelasInput } from './compras.schema';
import { CalcularCompra, CalcularEntradaEstoque, CalcularEstornoEstoque, CalcularParcelasCompra } from './compras.calculo';

export interface FiltrosListagemCompra
{
    codForn?: number;
}

export class ComprasService
{
    constructor
    (
        private readonly repo:                ComprasRepository            = new ComprasRepository(),
        private readonly fornecedoresRepo:    FornecedoresRepository       = new FornecedoresRepository(),
        private readonly transportadorasRepo: TransportadorasRepository    = new TransportadorasRepository(),
        private readonly condicoesRepo:       CondicoesPagamentoRepository = new CondicoesPagamentoRepository(),
        private readonly produtosRepo:        ProdutosRepository           = new ProdutosRepository(),
        private readonly parcelasCondicaoRepo: ParcelasRepository          = new ParcelasRepository(),
        private readonly formasPagamentoRepo: FormasPagamentoRepository    = new FormasPagamentoRepository(),
    ) {}

    async ListCompras ( limit = 50, afterCursor?: CompraId, filtros: FiltrosListagemCompra = {} )
    {
        const compras = await this.repo.List ( limit, afterCursor, filtros );

        // O vlrTotal não é persistido (3FN): é calculado a partir dos itens de cada compra.
        return Promise.all ( compras.map ( async ( compra ) =>
        (
            { ...compra, vlrTotal: this.Calcular ( compra, await this.repo.ListItens ( compra ) ).vlrTotal }
        ) ) );
    }

    // Cabeçalho + itens numa resposta só: o formulário da compra é aberto em modo de
    // consulta (RN014) com a tabela de produtos completa.
    async FindCompra ( id: CompraId )
    {
        const compra = await this.repo.FindById ( id );

        if ( !compra )
        {
            throw new AppError ( 'Compra não encontrada.', 404 );
        }

        const itens    = await this.repo.ListItens ( id );
        const parcelas = await this.repo.ListParcelas ( id );
        const calculo  = this.Calcular ( compra, itens );

        // Total e, por item, rateio e custo unitário final são calculados aqui a cada
        // leitura — nenhum deles é coluna do banco.
        return {
            ...compra,
            vlrTotal: calculo.vlrTotal,
            itens: itens.map ( ( item, indice ) =>
            (
                {
                    ...item,
                    percentualRateio:  calculo.itens[ indice ].percentualRateio,
                    valorRateio:       calculo.itens[ indice ].valorRateio,
                    custoMedioProduto: calculo.itens[ indice ].custoMedioProduto,
                }
            ) ),
            parcelas,
        };
    }

    // RN007 — numa compra nova, número/modelo/série/fornecedor são validados antes de
    // liberar os demais campos do formulário.
    async ValidarChave ( chave: CompraId )
    {
        await ValidarDocumentoFiscalInexistente
        (
            chave,
            ( chaveConsultada ) => this.repo.ExisteDocumento ( chaveConsultada )
        );

        return { valido: true };
    }

    /**
     * Prévia dos totais para o formulário (RN011–RN012): o mesmo cálculo da gravação,
     * acrescido, por item, do que o rodapé da compra exibe (RN015) — saldo e custo médio
     * do produto caso a compra seja lançada agora, e o preço de venda cadastrado.
     * Nada é gravado; o Frontend não refaz nenhuma conta.
     */
    async SimularCompra ( data: SimularCompraInput )
    {
        const produtos: Produtos[] = [];

        for ( const item of data.itens )
        {
            const produto = await this.produtosRepo.FindById ( item.codProduto );

            if ( !produto )
            {
                throw new AppError ( `Produto ${ item.codProduto } não existe.`, 400 );
            }

            produtos.push ( produto );
        }

        const calculo = CalcularCompra ( data );

        return {
            ...calculo,
            itens: calculo.itens.map ( ( item, indice ) =>
            {
                const produto   = produtos[ indice ];
                const projecao  = CalcularEntradaEstoque ( produto, item.quantidade, item.custoMedioProduto );

                return {
                    ...item,
                    produto:              produto.produto,
                    undProduto:           produto.undProduto,
                    estoqueAtual:         produto.estoque,
                    estoqueResultante:    projecao.estoque,
                    custoMedioResultante: projecao.custoMedioProd,
                    precoVenda:           produto.precoVenda,
                };
            } ),
        };
    }

    /**
     * RN022 — parcelas sugeridas para a compra a partir da condição de pagamento escolhida:
     * o total vem do cálculo da compra (nunca do cliente) e as `Parcelas` da condição viram
     * linhas com valor e vencimento. Nada é gravado: o usuário ajusta as linhas no
     * formulário (RN023) e só então a compra é salva.
     */
    async GerarParcelas ( data: GerarParcelasInput )
    {
        if ( !( await this.condicoesRepo.FindById ( data.codCondDePag ) ) )
        {
            throw new AppError ( 'Condição de pagamento informada não existe.', 400 );
        }

        const parcelasCondicao = await this.parcelasCondicaoRepo.List ( 100, 0, data.codCondDePag );

        if ( parcelasCondicao.length === 0 )
        {
            throw new AppError ( 'A condição de pagamento não possui parcelas cadastradas.', 400 );
        }

        const { vlrTotal } = CalcularCompra ( data );

        return {
            vlrTotal,
            parcelas: CalcularParcelasCompra ( vlrTotal, parcelasCondicao, data.dtEmissao ),
        };
    }

    /**
     * A compra nasce já lançada (não há rascunho nem edição — RN013): numa única transação
     * (RNF06) grava cabeçalho, itens e parcelas e dá entrada de cada item no estoque,
     * recalculando o custo médio ponderado do produto (RN018). Rateio, custo unitário dos
     * itens e vlrTotal são sempre calculados aqui, nunca aceitos do cliente. Não gera
     * Contas a Pagar.
     */
    async CreateCompra ( data: CreateCompraInput, codUser: number )
    {
        const id: CompraId = { numero: data.numero, modelo: data.modelo, serie: data.serie, codForn: data.codForn };

        await ValidarDocumentoFiscalInexistente
        (
            id,
            ( chaveConsultada ) => this.repo.ExisteDocumento ( chaveConsultada )
        );

        await this.AssertReferencias ( data.codForn, data );

        const calculo = CalcularCompra ( data );

        this.AssertSomaParcelas ( data, calculo.vlrTotal );

        await WithTransaction ( async ( transaction ) =>
        {
            await this.repo.Create ( { ...data }, codUser, transaction );

            for ( const item of this.ItensGravacao ( data ) )
            {
                await this.repo.CreateItem ( id, item, codUser, transaction );
            }

            for ( const parcela of data.parcelas )
            {
                await this.repo.CreateParcela ( id, parcela, codUser, transaction );
            }

            for ( const [ indice, item ] of data.itens.entries() )
            {
                const produto = await this.produtosRepo.FindByIdForUpdate ( item.codProduto, transaction );

                if ( !produto )
                {
                    throw new AppError ( `O produto ${ item.codProduto } não está ativo; a compra não pode ser lançada.`, 409 );
                }

                await this.produtosRepo.AtualizarEstoqueCusto
                (
                    item.codProduto,
                    CalcularEntradaEstoque ( produto, item.quantidade, calculo.itens[ indice ].custoMedioProduto ),
                    codUser,
                    transaction
                );
            }
        } );

        return this.FindCompra ( id );
    }

    /**
     * RN014 — cancela a compra lançada: grava a justificativa e estorna, na mesma
     * transação, o estoque e o custo médio de cada item. A reautenticação (RN003) é feita
     * pelo Frontend até o EP-10.
     */
    async CancelarCompra ( id: CompraId, justificativaCancelamento: string, codUser: number )
    {
        const compra = await this.repo.FindById ( id );

        if ( !compra )
        {
            throw new AppError ( 'Compra não encontrada.', 404 );
        }

        if ( compra.justificativaCancelamento !== null )
        {
            throw new AppError ( 'Esta compra já foi cancelada.', 409 );
        }

        await WithTransaction ( async ( transaction ) =>
        {
            if ( !( await this.repo.Cancelar ( id, justificativaCancelamento, codUser, transaction ) ) )
            {
                throw new AppError ( 'Esta compra já foi cancelada.', 409 );
            }

            const itens   = await this.repo.ListItens ( id, transaction );
            const calculo = this.Calcular ( compra, itens );

            for ( const [ indice, item ] of itens.entries() )
            {
                const produto = await this.produtosRepo.FindByIdForUpdate ( item.codProduto, transaction );
                const estorno = produto
                    ? CalcularEstornoEstoque ( produto, item.quantidade, calculo.itens[ indice ].custoMedioProduto )
                    : null;

                if ( !estorno )
                {
                    throw new AppError
                    (
                        `Estoque insuficiente para estornar o produto ${ item.produto } (${ item.quantidade } unidades).`,
                        409
                    );
                }

                await this.produtosRepo.AtualizarEstoqueCusto ( item.codProduto, estorno, codUser, transaction );
            }
        } );

        return this.FindCompra ( id );
    }

    // Só o que o usuário informa é gravado (incluindo a unidade — RN020); o que é cálculo
    // não vai para o banco.
    private ItensGravacao ( data: CabecalhoCompraInput )
    {
        return data.itens.map ( ( item ) =>
        (
            {
                codProduto:    item.codProduto,
                quantidade:    item.quantidade,
                valorUnitario: item.valorUnitario,
                desconto:      item.desconto,
                unidade:       item.unidade,
            }
        ) );
    }

    // Cálculo da compra já gravada: itens e despesas vêm do banco (colunas DECIMAL, já como
    // string de 2 casas), os totais e o rateio saem de `CalcularCompra`.
    private Calcular
    (
        compra: Pick < CompraDetalhe, 'frete' | 'seguro' | 'despesas' >,
        itens:  Pick < CompraItem, 'codProduto' | 'quantidade' | 'valorUnitario' | 'desconto' >[]
    )
    {
        return CalcularCompra
        ( {
            frete:    compra.frete,
            seguro:   compra.seguro,
            despesas: compra.despesas,
            itens:    itens.map ( ( item ) =>
            (
                {
                    codProduto:    item.codProduto,
                    quantidade:    item.quantidade,
                    valorUnitario: item.valorUnitario,
                    desconto:      item.desconto,
                }
            ) ),
        } );
    }

    // RN023 — a soma das parcelas fecha exatamente no vlrTotal calculado aqui.
    private AssertSomaParcelas ( data: CabecalhoCompraInput, vlrTotal: string )
    {
        const somaCentavos = data.parcelas.reduce ( ( soma, parcela ) => soma + Math.round ( Number ( parcela.valor ) * 100 ), 0 );

        if ( somaCentavos !== Math.round ( Number ( vlrTotal ) * 100 ) )
        {
            throw new AppError
            (
                `A soma das parcelas (R$ ${ ( somaCentavos / 100 ).toFixed ( 2 ) }) deve ser igual ao total da compra (R$ ${ vlrTotal }).`,
                400
            );
        }
    }

    private async AssertReferencias ( codForn: number, data: CabecalhoCompraInput, transaction?: postgres.TransactionSql )
    {
        if ( !( await this.fornecedoresRepo.FindById ( codForn, transaction ) ) )
        {
            throw new AppError ( 'Fornecedor informado não existe.', 400 );
        }

        if ( data.codTransp && !( await this.transportadorasRepo.FindById ( data.codTransp, transaction ) ) )
        {
            throw new AppError ( 'Transportadora informada não existe.', 400 );
        }

        if ( !( await this.condicoesRepo.FindById ( data.codCondDePag, transaction ) ) )
        {
            throw new AppError ( 'Condição de pagamento informada não existe.', 400 );
        }

        for ( const item of data.itens )
        {
            if ( !( await this.produtosRepo.FindById ( item.codProduto, transaction ) ) )
            {
                throw new AppError ( `Produto ${ item.codProduto } não existe.`, 400 );
            }
        }

        for ( const parcela of data.parcelas )
        {
            if ( !( await this.formasPagamentoRepo.FindById ( parcela.codFormaDePag, transaction ) ) )
            {
                throw new AppError ( `Forma de pagamento ${ parcela.codFormaDePag } não existe.`, 400 );
            }
        }
    }
}
