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
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
  ModalOverlay, ModalCard, AcoesBotoes,
  TrSelecionavel,
} from './style';
import PaisForm from './PaisForm';

interface Props
{
  onSelecionar: ( pais: Pais ) => void;
  onCancelar: () => void;
}

const columnHelper = createColumnHelper < Pais >();

export function PaisConsulta ( { onSelecionar, onCancelar }: Props )
{
  'use no memo';
  const [ dados, setDados ] = useState < Pais[] > ( [] );
  const [ selecionado, setSel ] = useState ( false );
  const [ paisSel, setPaisSel ] = useState < Pais | null >( null );
  const [ edit, setEdit ] = useState < Partial < Pais > | null >( null );
  const [ erro, setErro ] = useState ( '' );
  const { sorting, setSorting } = useTabelaOrdenada ( 'pais' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ] = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const Carregar = () =>
    paisesService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () =>
  {
    Carregar();
  }, [ ] );

  const Excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão deste país?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await paisesService.remover ( id );

      if ( paisSel?.codPais === id )
      {
        setPaisSel ( null );
      }

      Carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const ToggleSel = async ( pais: Pais ) => 
  {
    if ( pais )
    {
      setPaisSel ( pais );
      setSel ( true );
    }
    else
    {
      setPaisSel ( null )
      setSel ( false );
    }
  }

  const columns = [
    columnHelper.accessor ( 'codPais', { header: 'Código' } ),
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
    columnHelper.accessor ( 'codUser', { header: 'Código Usuário', cell: ( info ) => info.getValue() ?? '-' } ),
    columnHelper.accessor ( 'isActive', { header: 'Status' } ),
    columnHelper.display (
    {
      id: 'acoes',
      header: 'Ações',
      cell: ( { row } ) => (
        <GrupoBotoes>
          <Botao
            $variante="secundario"
            onClick={ ( evento ) => { evento.stopPropagation(); setEdit ( row.original ); } }
          >
            Editar
          </Botao>
          <Botao
            $variante="perigo"
            onClick={ ( evento ) => { evento.stopPropagation(); Excluir ( row.original.codPais ); } }
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
      data: dados,
      columns,
      state: { sorting, globalFilter, pagination },
      onSortingChange: setSorting,
      onGlobalFilterChange: setGlobalFilter,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel ( ),
      getSortedRowModel: getSortedRowModel ( ),
      getFilteredRowModel: getFilteredRowModel ( ),
      getPaginationRowModel: getPaginationRowModel ( ),
    }
  );

  return (
    <>
      <ModalOverlay onClick={ onCancelar }>
        <ModalCard
          onClick={ ( evento ) => evento.stopPropagation() }
          style={ { maxWidth: '1100px', width: '95vw' } }
        >
          <Toolbar>
            <h3>Selecionar País</h3>
            <Botao onClick={ () => setEdit ( {} ) }>Novo País</Botao>
          </Toolbar>

          <InputBusca
            placeholder="Buscar países…"
            value={ globalFilter }
            onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
            autoFocus
          />

          { erro && <Alerta role="alert">{ erro }</Alerta> }

          <TabelaWrapper>
            <Tabela>
              <thead>
                {
                  table.getHeaderGroups().map ( ( headerGroup ) => (
                    <tr key={ headerGroup.id }>
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
                {
                  table.getRowModel().rows.map ( ( row ) => (
                    <TrSelecionavel
                      key={ row.id }
                      onClick={ () => ( ToggleSel ( row.original ) ) }
                      $selecionado = { paisSel?.codPais == row.original.codPais ? true : false }
                    >
                      {
                        row.getVisibleCells().map ( ( cell ) => (
                          <td key={ cell.id }>
                            { flexRender ( cell.column.columnDef.cell, cell.getContext() ) }
                          </td>
                        ))
                      }
                    </TrSelecionavel>
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

          <AcoesBotoes style={ { marginTop: '1rem' } }>
            <Botao type="button" $variante="secundario" onClick={ onCancelar }>
              Cancelar
            </Botao>
            <Botao
              type="button"
              disabled={ !selecionado }
              onClick={ () => paisSel && onSelecionar ( paisSel ) }
            >
              Selecionar
            </Botao>
          </AcoesBotoes>
        </ModalCard>
      </ModalOverlay>

      { 
        edit !== null && (
          <PaisForm
            inicial={ edit }
            onSalvo={ ( salvo ) =>
            {
                // Cadastro novo feito dentro da consulta já volta selecionado ao formulário de origem.
                const novo = edit !== null && Object.keys ( edit ).length === 0;

                setEdit ( null );

                if ( novo )
                {
                    onSelecionar ( salvo );
                    return;
                }

                Carregar();
            }}
            onCancelar={ () => setEdit ( null ) }
          />
        )
      }
    </>
  );
}
