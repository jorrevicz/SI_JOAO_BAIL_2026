import { createColumnHelper } from '@tanstack/react-table';
import { transportadorasService, type Transportadora } from '../../services/transportadoras';
import { ConsultaSelecao } from '../../components/consultaSelecao';
import { InfoBlock } from '../../components/tabela/style';

interface Props
{
  onSelecionar: ( transportadora: Transportadora ) => void;
  onCancelar:   () => void;
}

const columnHelper = createColumnHelper < Transportadora > ();

const colunas = [
  columnHelper.accessor ( 'codTransp', { header: 'Código' } ),
  columnHelper.accessor ( 'transportadora', { header: 'Transportadora', cell: ( info ) => <InfoBlock>{ info.getValue() }</InfoBlock> } ),
  columnHelper.accessor ( 'nomeFantasia', { header: 'Nome fantasia', cell: ( info ) => info.getValue() ?? '—' } ),
  columnHelper.accessor ( 'cpfCnpjTransp', { header: 'CPF / CNPJ', cell: ( info ) => info.getValue() ?? '—' } ),
];

export function TransportadoraConsulta ( { onSelecionar, onCancelar }: Props )
{
  return (
    <ConsultaSelecao
      titulo="Selecionar Transportadora"
      placeholder="Buscar transportadora…"
      carregar={ () => transportadorasService.listar ( undefined, { limit: 100 } ) }
      colunas={ colunas }
      chaveDe={ ( transportadora ) => transportadora.codTransp }
      colunaPadrao="transportadora"
      onSelecionar={ onSelecionar }
      onCancelar={ onCancelar }
    />
  );
}
