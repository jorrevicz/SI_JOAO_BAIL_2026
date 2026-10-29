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
import { notasFiscaisService } from '../../services/notasFiscais';
import NotaFiscalForm, { type ModoNotaFiscal } from '../notasFiscais/NotaFiscalForm';
import type { NotaFiscalDetalhe } from '../../services/notasFiscais';

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

// Gerar: a compra de origem; consultar: a nota ativa da compra (RN003).
interface FormularioNotaAberto
{
  modo:    ModoNotaFiscal;
  compra?: CompraDetalhe;
  nota?:   NotaFiscalDetalhe;
}

export default function ComprasPage ()
{
  'use no memo';
  const [ dados, setDados ]           = useState < Compra[] > ( [] );
  const [ formulario, setFormulario ] = useState < FormularioAberto | null > ( null );
  const [ formularioNota, setFormularioNota ] = useState < FormularioNotaAberto | null > ( null );
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

  // RN002/RN003 — compra sem nota abre a geração; com nota (gerada ou cancelada), só a
  // consulta dela. A nota tem as mesmas chaves da compra.
  const abrirNota = async ( compra: Compra ) =>
  {
    setErro ( '' );

    try
    {
      if ( compra.situacaoNotaFiscal )
      {
        setFormularioNota ( {
          modo: 'consulta',
          nota: await notasFiscaisService.obter (
            { numero: compra.numero, modelo: compra.modelo, serie: compra.serie, codFornecedor: compra.codForn }
          ),
        } );
      }
      else
      {
        setFormularioNota ( { modo: 'gerar', compra: await comprasService.obter ( chaveDe ( compra ) ) } );
      }
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
    columnHelper.accessor ( 'situacaoNotaFiscal', { header: 'NF-e', cell: ( info ) => info.getValue() ?? '—' } ),
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
            {/* RN003 — com nota (gerada ou cancelada) só a consulta; sem nota, gerar (RN002). */}
            {
              ( compra.situacaoNotaFiscal || !cancelada ) && (
                <Botao $variante="secundario" onClick={ () => { void abrirNota ( compra ); } }>
                  { compra.situacaoNotaFiscal ? <InfoBlock>Cons. NF-e</InfoBlock> : <InfoBlock>Gerar NF-e</InfoBlock> }
                </Botao>
              )
            }
            <Botao $variante="secundario" onClick={ () => { void abrir ( compra, 'consulta' ); } }>
              Consultar
            </Botao> 
            {/* A compra com NF-e gerada só é cancelada depois de cancelar a nota (o Backend responde 409). */}
            {
              !cancelada && (
                <Botao $variante="perigo" onClick={ () => { void abrir ( compra, 'cancelar' ); } }>
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

      {
        formularioNota !== null && (
          <NotaFiscalForm
            modo={ formularioNota.modo }
            compra={ formularioNota.compra }
            nota={ formularioNota.nota }
            onConcluido={ () =>
            {
              setFormularioNota ( null );
              carregar();
            }}
            onFechar={ () => setFormularioNota ( null ) }
          />
        )
      }
    </section>
  );
}
