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
import { formatarData } from '../../utils/formatters';
import { formasPagamentoService, type FormaPagamento } from '../../services/formasPagamento';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
import { FormaPagamentoForm } from './FormaPagamentoForm';

const columnHelper = createColumnHelper < FormaPagamento >();

export function FormasPagamentoPage ()
{
  'use no memo';

  const [ dados, setDados ] = useState < FormaPagamento[] > ([]);
  const [ editando, setEditando ] = useState < Partial < FormaPagamento > | null > ( null );
  const [ erro, setErro ] = useState ( '' );
  const { sorting, setSorting } = useTabelaOrdenada ( 'formaDePag' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ] = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const carregar = () =>
    formasPagamentoService.listar().then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () => { carregar(); }, [] );

  const excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão desta forma de pagamento?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await formasPagamentoService.remover ( id );
      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const columns = [
    columnHelper.accessor ( 'codFormaDePag', { header: 'Código' } ),
    columnHelper.accessor ( 'formaDePag', { header: 'Forma de Pagamento' } ),
    columnHelper.accessor (
      'prazoCompensacao',
      { header: 'Prazo (dias)', cell: ( info ) => info.getValue() ?? '—' }
    ),
    columnHelper.accessor (
      'dtCriacao',
      { header: 'Criação', cell: ( info ) => formatarData ( info.getValue() ) }
    ),
    columnHelper.accessor (
          'dtEdicao',
          { header: 'Edição', cell: ( info ) => formatarData ( info.getValue() ) }
    ),
    columnHelper.accessor ( 'codUser', { header: 'Código Usuário', cell: ( info ) => info.getValue() ?? '-' } ),
    columnHelper.accessor ( 'isActive', { header: 'Status' } ),
    columnHelper.display ({
      id: 'acoes',
      header: 'Ações',
      cell: ( { row } ) => (
        <>
          <Botao $variante="secundario" onClick={ () => setEditando ( row.original ) }>
            Editar
          </Botao>
          <Botao $variante="perigo" onClick={ () => excluir ( row.original.codFormaDePag ) }>
            Excluir
          </Botao>
        </>
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
          <h2>Formas de Pagamento</h2>
        </div>
        <GrupoBotoes>
          <Botao onClick={ () => setEditando ( {} ) }>
            Nova Forma
          </Botao>
        </GrupoBotoes>
      </Toolbar>

      <InputBusca
        placeholder="Buscar formas de pagamento…"
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
              <tr key={ row.id }>
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
        <FormaPagamentoForm
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
