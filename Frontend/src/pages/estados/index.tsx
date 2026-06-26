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
import { estadosService, type Estado } from '../../services/estados';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca, TooltipWrapper,
  Breadcrumb, BreadcrumbLink,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo,
  TrSelecionavel, ContextoBanner, Alerta,
} from './style';
import BotaoConsultar from '../../components/botaoConsultar';
import EstadoForm from './EstadoForm';

const columnHelper = createColumnHelper < Estado >();

export default function EstadosPage()
{
  'use no memo';
  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();
  const codPaisParam = searchParams.get ( 'codPais' );
  const nomePais = searchParams.get ( 'pais' ) ?? '';
  const codPais = codPaisParam ? Number ( codPaisParam ) : undefined;

  const [ dados, setDados ] = useState < Estado[] >([]);
  const [ editando, setEditando ] = useState < Partial < Estado > | null >( null );
  const [ erro, setErro ] = useState ( '' );
  const { sorting, setSorting } = useTabelaOrdenada ( 'estado' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ] = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );
  const [ codEstadoSel, setCodEstadoSel ] = useState < number | null > ( null );
  const [ estadoSel, setEstadoSel ] = useState ( '' );

  const carregar = () =>
    estadosService.listar ( codPais ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect ( () => { carregar(); }, [ codPais ] );

  const excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão deste estado?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await estadosService.remover ( id );
      if ( codEstadoSel === id )
      {
        setCodEstadoSel ( null );
        setEstadoSel ( '' );
      }
      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const toggleSelecao = ( estado: Estado ) =>
  {
    if ( codEstadoSel === estado.codEstado )
    {
      setCodEstadoSel ( null );
      setEstadoSel ( '' );
    }
    else
    {
      setCodEstadoSel ( estado.codEstado );
      setEstadoSel ( estado.estado );
    }
  };

  const columns = [
    columnHelper.accessor ( 'uf', { header: 'UF' } ),
    columnHelper.accessor ( 'estado', { header: 'Estado' } ),
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
            onClick={ ( evento ) => { evento.stopPropagation(); excluir ( row.original.codEstado ); } }
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
        <div>
          <Breadcrumb aria-label="navegação">
            <BreadcrumbLink to="/paises">Países</BreadcrumbLink>
            { codPais && nomePais && (
              <>
                <span>/</span>
                <span>{ nomePais }</span>
              </>
            )}
          </Breadcrumb>
          <h2>Estados</h2>
        </div>
        <GrupoBotoes>
          <BotaoConsultar
            rota="/cidades"
            params={{ codEstado: codEstadoSel, estado: estadoSel, codPais: codPais, pais: nomePais }}
          >
            Consultar Cidades
          </BotaoConsultar>
          <TooltipWrapper data-tooltip={ !codPais ? 'Selecione um país para registrar um novo estado' : undefined }>
            <Botao onClick={ () => setEditando ( { codPais } ) } disabled={ !codPais }>
              Novo Estado
            </Botao>
          </TooltipWrapper>
        </GrupoBotoes>
      </Toolbar>

      <GrupoBotoes>
        <InputBusca
          placeholder="Buscar estados…"
          value={ globalFilter }
          onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
        />

        { codPais && (
          <ContextoBanner>
            Exibindo estados de <strong>{ nomePais }</strong>
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
              <TrSelecionavel
                key={ row.id }
                $selecionado={ row.original.codEstado === codEstadoSel }
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
        <Botao $variante="secundario" onClick={ () => navigate ( '/paises' ) }>
          ← Voltar
        </Botao>
      </RodapeTabela>

      { editando !== null && (
        <EstadoForm
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
