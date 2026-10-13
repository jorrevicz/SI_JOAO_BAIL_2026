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
import { formatarDataHora } from '../../utils/formatters';
import
{
  comprasService,
  type Compra,
  type CompraDetalhe,
  type CompraId,
} from '../../services/compras';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca, InfoBlock,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
import CompraForm, { type ModoCompra } from './CompraForm';

const columnHelper = createColumnHelper < Compra >();

const chaveDe = ( compra: CompraId ): CompraId =>
  ( { numero: compra.numero, modelo: compra.modelo, serie: compra.serie, codForn: compra.codForn } );

// RN013 — toda compra nasce lançada; cancelada é derivada da justificativa.
function DescricaoSituacao ( compra: Compra )
{
  return compra.justificativaCancelamento ? 'Cancelada' : 'Lançada';
}

interface FormularioAberto
{
  modo:   ModoCompra;
  compra: CompraDetalhe | null;
}

export default function ComprasPage ()
{
  'use no memo';
  const [ dados, setDados ]           = useState < Compra[] > ( [] );
  const [ formulario, setFormulario ] = useState < FormularioAberto | null > ( null );
  const [ erro, setErro ]             = useState ( '' );
  const { sorting, setSorting }       = useTabelaOrdenada ( [ 'fornecedor', 'numero' ] );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const carregar = () =>
    comprasService.listar()
      .then ( setDados )
      .catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () =>
  {
    carregar();
  }, [] );

  // Consultar/cancelar abrem o formulário com o detalhe completo (itens).
  const abrir = async ( compra: Compra, modo: ModoCompra ) =>
  {
    setErro ( '' );

    try
    {
      setFormulario ( { modo, compra: await comprasService.obter ( chaveDe ( compra ) ) } );
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const columns = [ 
    columnHelper.accessor ( 'modelo', { header: 'Modelo' } ),
    columnHelper.accessor ( 'numero', { header: 'Número' } ),
    columnHelper.accessor ( 'serie', { header: 'Série' } ),
    columnHelper.accessor ( 'codForn', { header: 'Cód. Fornecedor' } ),
    columnHelper.accessor ( 'fornecedor', { header: 'Fornecedor', cell: ( info ) => <InfoBlock title={ info.getValue() }>{ info.getValue() }</InfoBlock> } ),
    columnHelper.accessor (
      'dtEmissao',
      { header: 'Emissão', cell: ( info ) => <InfoBlock>{ formatarDataHora ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtChegada',
      { header: 'Chegada', cell: ( info ) => <InfoBlock>{ formatarDataHora ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtEntrada',
      { header: 'Entrada', cell: ( info ) => <InfoBlock>{ formatarDataHora ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor ( 'codTransp', { header: 'Cód. Transportadora', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor ( 'codCondDePag', { header: 'Cód. Cond. Pagamento' } ),
    columnHelper.accessor ( 'frete', { header: 'Frete (R$)' } ),
    columnHelper.accessor ( 'seguro', { header: 'Seguro (R$)' } ),
    columnHelper.accessor ( 'despesas', { header: 'Despesas (R$)' } ),
    columnHelper.accessor ( 'vlrTotal', { header: 'Total (R$)' } ),
    columnHelper.accessor ( ( compra ) => DescricaoSituacao ( compra ), { header: 'Situação', id: 'situacao', cell: ( info ) => <InfoBlock>{ info.getValue() }</InfoBlock> } ),
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
        const compra    = row.original;
        const cancelada = !!compra.justificativaCancelamento;
        return (
          <GrupoBotoes>
            {
              !cancelada && (
                <>
                  <Botao $variante="secundario" onClick={ () => { void abrir ( compra, 'consulta' ); } }>
                    Consultar
                  </Botao>

                  <Botao $variante="perigo" onClick={ () => { void abrir ( compra, 'cancelar' ); } }>
                    Cancelar
                  </Botao>
                </>
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
        <h2>Compras</h2>
        <GrupoBotoes> 
          <Botao onClick={ () => setFormulario ( { modo: 'novo', compra: null } ) }>Nova Compra</Botao>
        </GrupoBotoes>
      </Toolbar>

      <>
        <InputBusca
          placeholder="Buscar compras…"
          value={ globalFilter }
          onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
        />
      </> 

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
              <tr key={ `${ row.original.numero }-${ row.original.modelo }-${ row.original.serie }-${ row.original.codForn }` }>
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
          <CompraForm
            compra={ formulario.compra }
            modo={ formulario.modo }
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
