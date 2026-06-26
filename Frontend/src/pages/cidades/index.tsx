import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { cidadesService, type Cidade } from '../../services/cidades';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca, TooltipWrapper,
  Breadcrumb, BreadcrumbLink,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo,
  ContextoBanner, Alerta,
} from './style';
import CidadeForm from './CidadeForm';

const columnHelper = createColumnHelper < Cidade >();

export default function CidadesPage()
{
  'use no memo';
  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();
  const codEstadoParam = searchParams.get ( 'codEstado' );
  const nomeEstado = searchParams.get ( 'estado' ) ?? '';
  const codEstado = codEstadoParam ? Number ( codEstadoParam ) : undefined;
  const codPaisParam = searchParams.get ( 'codPais' );
  const nomePais = searchParams.get ( 'pais' ) ?? '';
  const codPais = codPaisParam ? Number ( codPaisParam ) : undefined;

  const [ dados, setDados ] = useState < Cidade[] >([]);
  const [ editando, setEditando ] = useState < Partial < Cidade > | null >( null );
  const [ erro, setErro ] = useState ( '' );
  const { sorting, setSorting } = useTabelaOrdenada ( 'cidade' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ] = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const carregar = () =>
    cidadesService.listar ( codEstado ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect ( () => { carregar(); }, [ codEstado ] );

  const excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão desta cidade?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await cidadesService.remover ( id );
      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const voltarParaEstados = () =>
  {
    const params = codPais
      ? `?codPais=${ codPais }&pais=${ encodeURIComponent ( nomePais ) }`
      : '';
    navigate ( `/estados${ params }` );
  };

  const estadosUrl = codPais
    ? `/estados?codPais=${ codPais }&pais=${ encodeURIComponent ( nomePais ) }`
    : '/estados';

  const columns = [
    columnHelper.accessor ( 'cidade', { header: 'Cidade' } ),
    columnHelper.accessor (
      'ddd',
      { header: 'DDD', cell: ( info ) => info.getValue() ?? '—' }
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
          <Botao $variante="secundario" onClick={ () => setEditando ( row.original ) }>
            Editar
          </Botao>
          <Botao $variante="perigo" onClick={ () => excluir ( row.original.codCidade ) }>
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
          <Breadcrumb aria-label="navegação">
            <BreadcrumbLink to="/paises">Países</BreadcrumbLink>
            <span>/</span>
            <BreadcrumbLink to={ estadosUrl }>
              { codPais && nomePais ? nomePais : 'Estados' }
            </BreadcrumbLink>
            { codEstado && nomeEstado && (
              <>
                <span>/</span>
                <span>{ nomeEstado }</span>
              </>
            )}
          </Breadcrumb>
          <h2>Cidades</h2>
        </div>
        <GrupoBotoes>
          <TooltipWrapper data-tooltip={ !codEstado ? 'Selecione um estado para registrar uma nova cidade' : undefined }>
            <Botao onClick={ () => setEditando ( { codEstado } ) } disabled={ !codEstado }>
              Nova Cidade
            </Botao>
          </TooltipWrapper>
        </GrupoBotoes>
      </Toolbar>

      <GrupoBotoes>
        <InputBusca
          placeholder="Buscar cidades…"
          value={ globalFilter }
          onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
        />

        { codEstado && (
          <ContextoBanner>
            Exibindo cidades de <strong>{ nomeEstado }</strong>
          </ContextoBanner>
        )}
      </GrupoBotoes>

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
        <Botao $variante="secundario" onClick={ voltarParaEstados }>
          ← Voltar
        </Botao>
      </RodapeTabela>

      { editando !== null && (
        <CidadeForm
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
