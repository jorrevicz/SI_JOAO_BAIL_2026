import { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type PaginationState,
} from '@tanstack/react-table';
import { useTabelaOrdenada } from '../../hooks/tabela';
import { formatarData, formatarDataHora } from '../../utils/formatters';
import { contasReceberService, type ContaAReceber, type ContaAReceberId } from '../../services/contasReceber';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
import ContaReceberForm from './ContaReceberForm';
import RegistrarPagamentoModal from './RegistrarPagamentoModal';
import CancelarContaModal from './CancelarContaModal';
import { InfoBlock } from '../../components/tabela/style';

const columnHelper = createColumnHelper < ContaAReceber >();

function ChaveConta ( conta: ContaAReceber )
{
  return `${ conta.numero }-${ conta.modelo }-${ conta.serie }-${ conta.parcela }`;
}

export default function ContasReceberPage ()
{
  'use no memo';
  const [ dados, setDados ]           = useState < ContaAReceber[] > ( [] );
  const [ editando, setEditando ]     = useState < Partial < ContaAReceber > | null > ( null );
  const [ recebendo, setRecebendo ]   = useState < ContaAReceber | null > ( null );
  const [ cancelando, setCancelando ] = useState < ContaAReceber | null > ( null );
  const [ erro, setErro ]             = useState ( '' );
  const { sorting, setSorting }       = useTabelaOrdenada ( 'numero' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const carregar = () =>
    contasReceberService.listar ( )
      .then ( setDados )
      .catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () =>
  {
    carregar();
  }, [ ] );

  const excluir = async ( id: ContaAReceberId ) =>
  {
    if ( !confirm ( 'Confirma a exclusão desta conta a receber?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await contasReceberService.remover ( id );
      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const columns = [
    columnHelper.accessor ( 'numero', { header: 'Número' } ),
    columnHelper.accessor ( 'modelo', { header: 'Modelo' } ),
    columnHelper.accessor ( 'serie', { header: 'Série' } ),
    columnHelper.accessor ( 'parcela', { header: 'Parcela' } ),
    columnHelper.accessor ( 'codCliente', { header: () => <>Código<br/>Cliente</> } ),
    columnHelper.accessor ( 'codFormaDePag', { header: () => <>Código<br/>Forma de Pagamento</> } ),
    columnHelper.accessor (
      'dtEmissao',
      { header: 'Emissão', cell: ( info ) => <InfoBlock>{ info.getValue() ? formatarDataHora ( info.getValue()! ) : '—' }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtVencimento',
      { header: 'Vencimento', cell: ( info ) => <InfoBlock>{ info.getValue() ? formatarDataHora ( info.getValue()! ) : '—' }</InfoBlock> }
    ),
    columnHelper.accessor ( 'valor', { header: 'Valor' } ),
    columnHelper.accessor ( 'juro', { header: 'Juro' } ),
    columnHelper.accessor ( 'desconto', { header: 'Desconto' } ),
    columnHelper.accessor ( 'multa', { header: 'Multa' } ),
    columnHelper.accessor ( 'valorBaixa', { header: 'Valor Recebido', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor (
      'dtBaixa',
      { header: 'Data da Baixa', cell: ( info ) => <InfoBlock>{ info.getValue() ? formatarData ( info.getValue()! ) : '—' }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtPagamento',
      { header: 'Data do Pagamento', cell: ( info ) => <InfoBlock>{ info.getValue() ? formatarData ( info.getValue()! ) : '—' }</InfoBlock> }
    ),
    columnHelper.accessor (
      'justificativaCancelamento',
      { header: 'Cancelamento',
        cell: ( info ) => (
          <InfoBlock>
            { info.getValue() ?? '—' }
          </InfoBlock>
        ), }
    ),
    columnHelper.accessor (
      'dtCriacao',
      { header: 'Criação', cell: ( info ) => <InfoBlock>{ formatarData ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtEdicao',
      { header: 'Edição', cell: ( info ) => <InfoBlock>{ formatarData ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor ( 'codUser', { header: 'Código Usuário', cell: ( info ) => info.getValue() ?? '-' } ),
    columnHelper.accessor ( 'isActive', { header: 'Status' } ),
    columnHelper.display ( {
      id:     'acoes',
      header: 'Ações',
      cell: ( { row } ) =>
      {
        const conta = row.original;
        const podeReceberOuCancelar = conta.valorBaixa === null && conta.justificativaCancelamento === null;

        return (
          <GrupoBotoes>
            <Botao
              $variante="secundario"
              onClick={ ( evento ) => { evento.stopPropagation(); setEditando ( conta ); } }
            >
              Editar
            </Botao>
            {
              podeReceberOuCancelar && (
                <>
                  <Botao
                    $variante="secundario"
                    onClick={ ( evento ) => { evento.stopPropagation(); setRecebendo ( conta ); } }
                  >
                    Registrar recebimento
                  </Botao>
                  <Botao
                    $variante="perigo"
                    onClick={ ( evento ) => { evento.stopPropagation(); setCancelando ( conta ); } }
                  >
                    Cancelar
                  </Botao>
                </>
              )
            }
            {
              !podeReceberOuCancelar && (
                <Botao
                  $variante="perigo"
                  onClick={ ( evento ) =>
                  {
                    evento.stopPropagation();
                    excluir ( { numero: conta.numero, modelo: conta.modelo, serie: conta.serie, parcela: conta.parcela } );
                  } }
                >
                  Excluir
                </Botao>
              )
            }
          </GrupoBotoes>
        );
      },
    } ),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable (
    {
      data:     dados,
      columns,
      state:    { sorting, globalFilter, pagination },
      onSortingChange:      setSorting,
      onGlobalFilterChange: setGlobalFilter,
      onPaginationChange:   setPagination,
      getCoreRowModel:       getCoreRowModel ( ),
      getSortedRowModel:     getSortedRowModel ( ),
      getFilteredRowModel:   getFilteredRowModel ( ),
      getPaginationRowModel: getPaginationRowModel ( ),
    }
  );

  return (
    <section>
      <Toolbar>
        <h2>Contas a Receber</h2>
        <GrupoBotoes>
          <Botao onClick={ () => setEditando ( {} ) }>Nova Conta a Receber</Botao>
        </GrupoBotoes>
      </Toolbar>

      <InputBusca
        placeholder="Buscar contas a receber…"
        value={ globalFilter }
        onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
      />

      { erro && <Alerta role="alert">{ erro }</Alerta> }

      <TabelaWrapper>
        <Tabela>
          <thead>
            { table.getHeaderGroups().map ( ( headerGroup ) => (
              <tr key={ headerGroup.id }>
                { headerGroup.headers.map ( ( header ) => (
                  <th key={ header.id } onClick={ header.column.getToggleSortingHandler() }>
                    { flexRender ( header.column.columnDef.header, header.getContext() ) }
                    { header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : '' }
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            { table.getRowModel().rows.map ( ( row ) => (
              <tr key={ ChaveConta ( row.original ) }>
                { row.getVisibleCells().map ( ( cell ) => (
                  <td key={ cell.id }>{ flexRender ( cell.column.columnDef.cell, cell.getContext() ) }</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Tabela>
      </TabelaWrapper>

      <RodapeTabela>
        <Paginacao>
          <Botao
            $variante="secundario"
            onClick={ () => table.previousPage() }
            disabled={ !table.getCanPreviousPage() }
          >
            ← Anterior
          </Botao>
          <PaginacaoInfo>
            Página { table.getState().pagination.pageIndex + 1 } de { table.getPageCount() } · { table.getFilteredRowModel().rows.length } itens
          </PaginacaoInfo>
          <Botao
            $variante="secundario"
            onClick={ () => table.nextPage() }
            disabled={ !table.getCanNextPage() }
          >
            Próxima →
          </Botao>
        </Paginacao>
      </RodapeTabela>

      { editando !== null && (
        <ContaReceberForm
          inicial={ editando }
          onSalvo={ () =>
          {
            setEditando ( null );
            carregar();
          }}
          onCancelar={ () => setEditando ( null ) }
        />
      )}

      { recebendo !== null && (
        <RegistrarPagamentoModal
          conta={ recebendo }
          onSalvo={ () =>
          {
            setRecebendo ( null );
            carregar();
          }}
          onCancelar={ () => setRecebendo ( null ) }
        />
      )}

      { cancelando !== null && (
        <CancelarContaModal
          conta={ cancelando }
          onSalvo={ () =>
          {
            setCancelando ( null );
            carregar();
          }}
          onCancelar={ () => setCancelando ( null ) }
        />
      )}
    </section>
  );
}
