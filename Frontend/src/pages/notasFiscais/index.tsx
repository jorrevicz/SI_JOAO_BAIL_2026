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
import { formatarDataHora } from '../../utils/formatters';
import
{
  notasFiscaisService,
  type NotaFiscal,
  type NotaFiscalDetalhe,
} from '../../services/notasFiscais';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca, InfoBlock,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
import NotaFiscalForm, { type ModoNotaFiscal } from './NotaFiscalForm';

const columnHelper = createColumnHelper < NotaFiscal >();

interface FormularioAberto
{
  modo: ModoNotaFiscal;
  nota: NotaFiscalDetalhe;
}

// Notas fiscais de entrada geradas a partir das compras. A geração fica na listagem de
// Compras (RN002); aqui só se consulta e cancela.
export default function NotasFiscaisPage ()
{
  'use no memo';
  const [ dados, setDados ]           = useState < NotaFiscal[] > ( [] );
  const [ formulario, setFormulario ] = useState < FormularioAberto | null > ( null );
  const [ erro, setErro ]             = useState ( '' );
  const { sorting, setSorting }       = useTabelaOrdenada ( [ 'fornecedor', 'numero' ] );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const carregar = () =>
    notasFiscaisService.listar()
      .then ( setDados )
      .catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () =>
  {
    carregar();
  }, [] );

  const abrir = async ( nota: NotaFiscal, modo: ModoNotaFiscal ) =>
  {
    setErro ( '' );

    try
    {
      setFormulario ( {
        modo,
        nota: await notasFiscaisService.obter (
          { numero: nota.numero, modelo: nota.modelo, serie: nota.serie, codFornecedor: nota.codFornecedor }
        ),
      } );
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const columns = [
    columnHelper.accessor ( 'modelo', { header: 'Modelo' } ),
    columnHelper.accessor ( 'serie', { header: 'Série' } ),
    columnHelper.accessor ( 'numero', { header: 'Número' } ), 
    columnHelper.accessor ( 'codFornecedor', { header: 'Cód. Fornecedor' } ),
    columnHelper.accessor ( 'fornecedor', { header: 'Fornecedor', cell: ( info ) => <InfoBlock title={ info.getValue() }>{ info.getValue() }</InfoBlock> } ),
    columnHelper.accessor ( 'chaveAcessoNfe', { header: 'Chave de acesso', cell: ( info ) => <InfoBlock title={ info.getValue() }>{ info.getValue() }</InfoBlock> } ),
    columnHelper.accessor (
      'dhEmiNfe',
      { header: 'Emissão', cell: ( info ) => <InfoBlock>{ formatarDataHora ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor ( 'fretePorConta', { header: 'Frete por conta' } ),
    columnHelper.accessor ( 'vlrTotalNota', { header: 'Total (R$)' } ),
    columnHelper.accessor ( ( nota ) => ( nota.isActive ? 'Gerada' : 'Cancelada' ), { header: 'Situação', id: 'situacao' } ),
    columnHelper.accessor (
      'justificativaCancelamento',
      { header: 'Justificativa do cancelamento', cell: ( info ) => <InfoBlock title={ info.getValue() ?? '' }>{ info.getValue() ?? '—' }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtCriacao',
      { header: 'Criação', cell: ( info ) => <InfoBlock>{ formatarDataHora ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtEdicao',
      { header: 'Edição', cell: ( info ) => <InfoBlock>{ formatarDataHora ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor ( 'codUser', { header: 'Cód. Usuário', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor ( 'isActive', { header: 'Ativo', cell: ( info ) => ( info.getValue() ? 'Sim' : 'Não' ) } ),
    columnHelper.display ( {
      id:     'acoes',
      header: 'Ações',
      cell: ( { row } ) =>
      {
        const nota = row.original;
        return (
          <GrupoBotoes>
            <Botao $variante="secundario" onClick={ () => { void abrir ( nota, 'consulta' ); } }>
              Consultar
            </Botao>
            {
              nota.isActive && (
                <Botao $variante="perigo" onClick={ () => { void abrir ( nota, 'cancelar' ); } }>
                  Cancelar
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
      getSortedRowModel:     getSortedRowModelInativosAoFinal ( ),
      getFilteredRowModel:   getFilteredRowModel ( ),
      getPaginationRowModel: getPaginationRowModel ( ),
    }
  );

  return (
    <section>
      <Toolbar>
        <h2>Notas Fiscais</h2>
      </Toolbar>

      <InputBusca
        placeholder="Buscar notas fiscais…"
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
              <tr key={ `${ row.original.numero }-${ row.original.modelo }-${ row.original.serie }-${ row.original.codFornecedor }` }>
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

      {
        formulario !== null && (
          <NotaFiscalForm
            modo={ formulario.modo }
            nota={ formulario.nota }
            onConcluido={ () =>
            {
              setFormulario ( null );
              carregar();
            }}
            onFechar={ () => setFormulario ( null ) }
          />
        )
      }
    </section>
  );
}
