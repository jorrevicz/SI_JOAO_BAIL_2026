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
import { paisesService, type Pais } from '../../services/paises';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo,
  TrSelecionavel, Alerta,
} from './style';
import BotaoConsultar from '../../components/botaoConsultar';
import PaisForm from './PaisForm';

const columnHelper = createColumnHelper < Pais >();

export default function PaisesPage()
{
  'use no memo';
  const [ dados, setDados ] = useState < Pais[] >([]);
  const [ editando, setEditando ] = useState < Partial < Pais > | null >( null );
  const [ erro, setErro ] = useState ( '' );
  const { sorting, setSorting } = useTabelaOrdenada ( 'pais' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ] = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );
  const [ codPaisSel, setCodPaisSel ] = useState < number | null > ( null );
  const [ paisSel, setPaisSel ] = useState ( '' );

  const carregar = () =>
    paisesService.listar().then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () =>
  {
    carregar();
  }, [] );

  const excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão deste país?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await paisesService.remover ( id );
      if ( codPaisSel === id )
      {
        setCodPaisSel ( null );
        setPaisSel ( '' );
      }
      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const toggleSelecao = ( pais: Pais ) =>
  {
    if ( codPaisSel === pais.codPais )
    {
      setCodPaisSel ( null );
      setPaisSel ( '' );
    }
    else
    {
      setCodPaisSel ( pais.codPais );
      setPaisSel ( pais.pais );
    }
  };

  const columns = [
    columnHelper.accessor ( 'pais', { header: 'País' } ),
    columnHelper.accessor ( 'sigla', { header: 'Sigla' } ),
    columnHelper.accessor (
      'ddi',
      { header: 'DDI', cell: ( info ) => info.getValue() ?? '—' }
    ),
    columnHelper.accessor (
      'moeda',
      { header: 'Moeda', cell: ( info ) => info.getValue() ?? '—' }
    ),
    columnHelper.accessor (
      'dtCriacao',
      { header: 'Criação', cell: ( info ) => formatarData ( info.getValue() ) }
    ),
    columnHelper.accessor (
      'dtEdicao',
      { header: 'Edição', cell: ( info ) => formatarData ( info.getValue() ) }
    ),

    columnHelper.display ({
      id: 'acoes',
      header: 'Ações',
      cell: ( { row } ) => (
        <>
          <Botao
            $variante="secundario"
            onClick={ ( evento ) => { evento.stopPropagation(); setEditando ( row.original ); } }
          >
            Editar
          </Botao>
          <Botao
            $variante="perigo"
            onClick={ ( evento ) => { evento.stopPropagation(); excluir ( row.original.codPais ); } }
          >
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
        <h2>Países</h2>
        <GrupoBotoes>
          <BotaoConsultar rota="/estados" params={{ codPais: codPaisSel, pais: paisSel }}>
            Consultar Estados
          </BotaoConsultar>
          <Botao onClick={ () => setEditando ( {} ) }>Novo País</Botao>
        </GrupoBotoes>
      </Toolbar>

      <InputBusca
        placeholder="Buscar países…"
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
              <TrSelecionavel
                key={ row.id }
                $selecionado={ row.original.codPais === codPaisSel }
                onClick={ () => toggleSelecao ( row.original ) }
              >
                { row.getVisibleCells().map ( ( cell ) => (
                  <td key={ cell.id }>{ flexRender ( cell.column.columnDef.cell, cell.getContext() ) }</td>
                ))}
              </TrSelecionavel>
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
        <PaisForm
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
