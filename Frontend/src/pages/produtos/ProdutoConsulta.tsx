import { createColumnHelper } from '@tanstack/react-table';
import { produtosService, type Produto } from '../../services/produtos';
import { ConsultaSelecao } from '../../components/consultaSelecao';
import { InfoBlock } from '../../components/tabela/style';

interface Props
{
  onSelecionar: ( produto: Produto ) => void;
  onCancelar:   () => void;
}

const columnHelper = createColumnHelper < Produto > ();

const colunas = [
  columnHelper.accessor ( 'codProd', { header: 'Código' } ),
  columnHelper.accessor ( 'produto', { header: 'Produto', cell: ( info ) => <InfoBlock title={ info.getValue() }>{ info.getValue() }</InfoBlock> } ),
  columnHelper.accessor ( 'undProduto', { header: 'Unidade', cell: ( info ) => info.getValue() ?? '—' } ),
  columnHelper.accessor ( 'estoque', { header: 'Estoque' } ),
  columnHelper.accessor ( 'custoMedioProd', { header: 'Custo médio (R$)' } ),
  columnHelper.accessor ( 'precoVenda', { header: 'Preço de venda (R$)' } ),
];

// Consulta de seleção de produto (itens da compra). O cadastro de produto, por exigir
// categorias, continua só na tela de Produtos.
export function ProdutoConsulta ( { onSelecionar, onCancelar }: Props )
{
  return (
    <ConsultaSelecao
      titulo="Selecionar Produto"
      placeholder="Buscar produto…"
      carregar={ () => produtosService.listar ( { limit: 100 } ) }
      colunas={ colunas }
      chaveDe={ ( produto ) => produto.codProd }
      colunaPadrao="produto"
      onSelecionar={ onSelecionar }
      onCancelar={ onCancelar }
    />
  );
}
