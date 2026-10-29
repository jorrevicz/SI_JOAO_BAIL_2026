import { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type PaginationState,
} from '@tanstack/react-table';
import { useTabelaOrdenada, getSortedRowModelInativosAoFinal } from '../../hooks/tabela';
import { formatarData } from '../../utils/formatters';
import { InfoBlock } from '../../components/tabela/style';
import { categoriasService, type Categoria } from '../../services/categorias';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
// import BotaoConsultar from '../../components/botaoConsultar';
import CategoriaForm from './CategoriaForm';

const columnHelper = createColumnHelper < Categoria >();

export default function CategoriasPage ()
{
  'use no memo';
  const [ dados, setDados ]       = useState < Categoria[] > ([]);
  const [ editando, setEditando ] = useState < Partial < Categoria > | null > ( null );
  const [ erro, setErro ]         = useState ( '' );
  const { sorting, setSorting }   = useTabelaOrdenada ( 'categoria' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );
  // const [ codCategoriaSel, setCodCategoriaSel ] = useState < number | null > ( null );
  // const [ categoriaSel, setCategoriaSel ]       = useState ( '' );

  const carregar = () =>
    categoriasService.listar ( )
      .then ( setDados )
      .catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () =>
  {
    carregar();
  }, [ ] );

  const excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão desta categoria?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await categoriasService.remover ( id );
      // if ( codCategoriaSel === id )
      // {
      //   setCodCategoriaSel ( null );
      //   setCategoriaSel ( '' );
      // }
      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  // const toggleSelecao = ( categoria: Categoria ) =>
  // {
  //   if ( codCategoriaSel === categoria.codCategoria )
  //   {
  //     setCodCategoriaSel ( null );
  //     setCategoriaSel ( '' );
  //   }
  //   else
  //   {
  //     setCodCategoriaSel ( categoria.codCategoria );
  //     setCategoriaSel ( categoria.categoria );
  //   }
  // };

  const columns = [
    columnHelper.accessor ( 'codCategoria', { header: 'Código' } ),
    columnHelper.accessor ( 'categoria', { header: 'Categoria' } ),
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
      cell: ( { row } ) => (
        <GrupoBotoes>
          <Botao
            $variante="secundario"
            onClick={ ( evento ) => { evento.stopPropagation(); setEditando ( row.original ); } }
          >
            Editar
          </Botao>
          <Botao
            $variante="perigo"
            onClick={ ( evento ) => { evento.stopPropagation(); excluir ( row.original.codCategoria ); } }
          >
            Excluir
          </Botao>
        </GrupoBotoes>
      ),
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
      getSortedRowModel:     getSortedRowModelInativosAoFinal ( ),
      getFilteredRowModel:   getFilteredRowModel ( ),
      getPaginationRowModel: getPaginationRowModel ( ),
    }
  );

  return (
    <section>
      <Toolbar>
        <h2>Categorias</h2>
        <Botao onClick={ () => setEditando ( {} ) }>Nova Categoria</Botao>
      </Toolbar>

      <InputBusca
        placeholder="Buscar categorias…"
        value={ globalFilter }
        onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
      />

      { erro && <Alerta role="alert">{ erro }</Alerta> }

      <TabelaWrapper>
        <Tabela>
          <thead>
            { 
              table.getHeaderGroups().map ( ( headerGroup ) => (
                <tr 
                  key={ headerGroup.id }
                >
                  { 
                    headerGroup.headers.map ( ( header ) => (
                      <th 
                        key={ header.id } 
                        onClick={ header.column.getToggleSortingHandler() }
                      >
                        { flexRender ( header.column.columnDef.header, header.getContext() ) }
                        { header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : '' }
                      </th>
                    ))
                  }
                </tr>
              ))
            }
          </thead>
          <tbody>
            { table.getRowModel().rows.map ( ( row ) => (
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
            ))}
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
        <CategoriaForm
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
