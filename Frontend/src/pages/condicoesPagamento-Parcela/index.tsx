import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
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
import { formatarData } from '../../utils/formatters';
import { condicoesPagamentoService, type CondicaoPagamento } from '../../services/condicoesPagamento';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
// import BotaoConsultar from '../../components/botaoConsultar';
import CondicaoPagamentoForm from './CondicaoPagamentoForm';
import { InfoBlock } from '../../components/tabela/style';
// import { TrSelecionavel } from '../paises/style';

const columnHelper = createColumnHelper < CondicaoPagamento >();

export default function CondicoesPagamentoPage ()
{
  'use no memo';
  // const navigate = useNavigate();
  const [ dados, setDados ] = useState < CondicaoPagamento[] > ([]);
  const [ editando, setEditando ] = useState < Partial < CondicaoPagamento > | null > ( null );
  const [ erro, setErro ] = useState ( '' );
  const { sorting, setSorting } = useTabelaOrdenada ( 'descricao' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ] = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );
  // const [ codCondPagSel, setCodCondPagSel ] = useState < number | null > ( null );
  // const [ condPagSel, setCondPagSel ] = useState ('')

  const carregar = () =>
    condicoesPagamentoService.listar().then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () => { carregar(); }, [] );

  const excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão desta condição de pagamento?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await condicoesPagamentoService.remover ( id );
      // if ( codCondPagSel === id )
      // {
      //   setCodCondPagSel ( null )
      //   setCondPagSel ('')
      // }
      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  // const verParcelas = ( condicao: CondicaoPagamento ) =>
  // {
  //   navigate ( `/parcelas?codCondDePag=${ condicao.codCondDePag }&descricao=${ encodeURIComponent ( condicao.descricao ?? '' ) }` );
  // };

  // const toggleSelecao = ( condPag: CondicaoPagamento ) =>
  // {
  //   if ( codCondPagSel === condPag.codCondDePag )
  //   {
  //     setCodCondPagSel ( null );
  //     setCondPagSel ('')
  //   }
  //   else
  //   {
  //     setCodCondPagSel ( condPag.codCondDePag );
  //     setCondPagSel ( condPag.descricao ?? '' );
  //   }
  // }

  const columns = [
    columnHelper.accessor ( 'codCondDePag', { header: 'Código' } ),
    columnHelper.accessor (
      'descricao',
      { 
        header: 'Descrição', 
        cell: ( info ) => (
          <InfoBlock>
            { info.getValue() ?? '—' }
          </InfoBlock>
        ) 
      }
    ),
    columnHelper.accessor (
      'juroCondPag',
      { header: 'Juros (%)', cell: ( info ) => info.getValue() != null ? parseFloat ( info.getValue()! ).toFixed ( 2 ) + '%' : '—' }
    ),
    columnHelper.accessor (
      'multaCondPag',
      { header: 'Multa (%)', cell: ( info ) => info.getValue() != null ? parseFloat ( info.getValue()! ).toFixed ( 2 ) + '%' : '—' }
    ),
    columnHelper.accessor (
      'descontoCondPag',
      { header: 'Desconto (%)', cell: ( info ) => info.getValue() != null ? parseFloat ( info.getValue()! ).toFixed ( 2 ) + '%' : '—' }
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
    columnHelper.display ({
      id: 'acoes',
      header: 'Ações',
      cell: ( { row } ) => (
        <GrupoBotoes>
          {/* <Botao $variante="secundario" onClick={ () => verParcelas ( row.original ) }>
            Parcelas
          </Botao> */}
          <Botao 
          $variante="secundario" 
          onClick={ () => setEditando ( row.original ) }>
            Editar
          </Botao>
          <Botao 
          $variante="perigo" 
          onClick={ () => excluir ( row.original.codCondDePag ) }>
            Excluir
          </Botao>
        </GrupoBotoes>
      ),
    }),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable (
    {
      data: dados,
      columns,
      state: { sorting, globalFilter, pagination },
      onSortingChange: setSorting,
      onGlobalFilterChange: setGlobalFilter,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    }
  );

  return (
    <section>
      <Toolbar>
        <div>
          <h2>Condições de Pagamento</h2>
        </div>
        <Botao onClick={ () => setEditando ( {} ) }>
          Nova Condição
        </Botao>
      </Toolbar>

      <InputBusca
        placeholder="Buscar condições…"
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
            { 
              table.getRowModel().rows.map ( ( row ) => (
                <tr 
                  key={ row.id }
                >
                  {
                    row.getVisibleCells().map ( ( cell ) => (
                      <td 
                        key={ cell.id }
                      >
                        { 
                          flexRender ( cell.column.columnDef.cell, cell.getContext() ) 
                        }
                      </td>
                    ))
                  }
                </tr>
              ))
            }
          </tbody>
        </Tabela>
      </TabelaWrapper>

      <RodapeTabela>
        <Paginacao>
          <GrupoBotoes>
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
          </GrupoBotoes>
        </Paginacao>
      </RodapeTabela>

      { editando !== null && (
        <CondicaoPagamentoForm
          inicial={ editando }
          onSalvo={ () =>
          {
            setEditando ( null );
            carregar();
          }}
          onCancelar={ () => setEditando ( null ) }
        />
      )}
    </section>
  );
}
