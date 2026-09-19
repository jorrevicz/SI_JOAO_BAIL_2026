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
import { ordensServicoService, type OrdemServico } from '../../services/ordensServico';
import { type Cliente } from '../../services/clientes';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
import { InfoBlock } from '../../components/tabela/style';
import OrdemServicoForm from './OrdemServicoForm';
import DiagnosticoModal from './DiagnosticoModal';
import { ClienteConsulta } from '../clientes/ClienteConsulta';

const columnHelper = createColumnHelper < OrdemServico >();

export default function OrdensServicoPage ()
{
  'use no memo';
  const [ dados, setDados ]       = useState < OrdemServico[] > ([]);
  const [ abrindo, setAbrindo ]   = useState ( false );
  const [ diagnosticando, setDiagnosticando ] = useState < OrdemServico | null > ( null );
  const [ clienteFiltro, setClienteFiltro ]   = useState < Cliente | null > ( null );
  const [ consultandoCliente, setConsultandoCliente ] = useState ( false );
  const [ erro, setErro ]         = useState ( '' );
  const { sorting, setSorting }   = useTabelaOrdenada ( 'numOdS' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const carregar = () =>
    ordensServicoService
      .listar ( { codCliente: clienteFiltro?.codCliente } )
      .then ( setDados )
      .catch ( ( err: Error ) => setErro ( err.message ) );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect ( () => { carregar(); }, [ clienteFiltro ] );

  const HandleSelecionarClienteFiltro = ( oCliente: Cliente ) =>
  {
    setClienteFiltro ( oCliente );
    setConsultandoCliente ( false );
  };

  const columns = [
    columnHelper.accessor ( 'numOdS', { header: 'Número' } ),
    columnHelper.accessor ( 'codCliente', { header: 'Código Cliente' } ),
    columnHelper.accessor ( 'atendente', { header: 'Atendente' } ),
    columnHelper.accessor (
      'defeito',
      {
        header: 'Defeito relatado',
        cell: ( info ) => (
          <InfoBlock>
            { info.getValue() }
          </InfoBlock>
        ),
      }
    ),
    columnHelper.accessor ( 'tipoOdS', { header: 'Tipo' } ),
    columnHelper.accessor (
      'dtAtendimento',
      { header: 'Diagnóstico', cell: ( info ) => info.getValue() ? formatarData ( info.getValue()! ) : 'Pendente' }
    ),
    columnHelper.accessor (
      'dtCriacao',
      { header: 'Criação', cell: ( info ) => formatarData ( info.getValue() ) }
    ),
    columnHelper.accessor (
      'dtEdicao',
      { header: 'Edição', cell: ( info ) => formatarData ( info.getValue() ) }
    ),
    columnHelper.accessor ( 'isActive', { header: 'Status' } ),
    columnHelper.display ( {
      id:     'acoes',
      header: 'Ações',
      cell: ( { row } ) => (
        <GrupoBotoes>
          <Botao
            $variante="secundario"
            onClick={ ( evento ) => { evento.stopPropagation(); setDiagnosticando ( row.original ); } }
          >
            Diagnóstico
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
      getSortedRowModel:     getSortedRowModel ( ),
      getFilteredRowModel:   getFilteredRowModel ( ),
      getPaginationRowModel: getPaginationRowModel ( ),
    }
  );

  return (
    <section>
      <Toolbar>
        <h2>Ordens de Serviço</h2>
        <Botao onClick={ () => setAbrindo ( true ) }>Nova OS</Botao>
      </Toolbar>

      <Toolbar>
        <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
          <Botao
            $variante="secundario"
            onClick={ () => setConsultandoCliente ( true ) }
          >
            Filtrar por cliente
          </Botao>
          {
            clienteFiltro && (
              <>
                <span style={ { fontSize: '0.875rem' } }>
                  { clienteFiltro.cliente }
                </span>
                <Botao
                  $variante="secundario"
                  onClick={ () => setClienteFiltro ( null ) }
                >
                  Limpar filtro
                </Botao>
              </>
            )
          }
        </div>
      </Toolbar>

      <InputBusca
        placeholder="Buscar ordens de serviço…"
        value={ globalFilter }
        onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
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
                      <th key={ header.id } onClick={ header.column.getToggleSortingHandler() }>
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

      { abrindo && (
        <OrdemServicoForm
          onSalvo={ () =>
          {
            setAbrindo ( false );
            carregar();
          }}
          onCancelar={ () => setAbrindo ( false ) }
        />
      )}

      { diagnosticando !== null && (
        <DiagnosticoModal
          os={ diagnosticando }
          onSalvo={ () =>
          {
            setDiagnosticando ( null );
            carregar();
          }}
          onCancelar={ () => setDiagnosticando ( null ) }
        />
      )}

      { consultandoCliente && (
        <ClienteConsulta
          onSelecionar={ HandleSelecionarClienteFiltro }
          onCancelar={ () => setConsultandoCliente ( false ) }
        />
      )}
    </section>
  );
}
