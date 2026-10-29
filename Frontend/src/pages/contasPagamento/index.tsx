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
import { formatarData, formatarDataHora } from '../../utils/formatters';
import { contasPagamentoService, type ContaAPagar } from '../../services/contasPagamento';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
import ContaPagamentoForm, { type ModoConta } from './ContaPagamentoForm';
import { InfoBlock } from '../../components/tabela/style';

const columnHelper = createColumnHelper < ContaAPagar >();

function ChaveConta ( conta: ContaAPagar )
{
  return `${ conta.numero }-${ conta.modelo }-${ conta.serie }-${ conta.codFornecedor }-${ conta.parcela }`;
}

export default function ContasPagamentoPage ()
{
  'use no memo';
  const [ dados, setDados ]         = useState < ContaAPagar[] > ( [] );
  const [ editando, setEditando ]   = useState < Partial < ContaAPagar > | null > ( null );
  const [ modoForm, setModoForm ]   = useState < ModoConta | undefined > ( undefined );
  const [ erro, setErro ]           = useState ( '' );
  const { sorting, setSorting }     = useTabelaOrdenada ( [ 'codFornecedor', 'numero', 'parcela' ] );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const carregar = () =>
    contasPagamentoService.listar ( )
      .then ( setDados )
      .catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () =>
  {
    carregar();
  }, [ ] );

  const abrirForm = ( conta: Partial < ContaAPagar >, modo?: ModoConta ) =>
  {
    setModoForm ( modo );
    setEditando ( conta );
  };

  const columns = [
    columnHelper.accessor ( 'modelo', { header: 'Modelo' } ),
    columnHelper.accessor ( 'serie', { header: 'Série' } ),
    columnHelper.accessor ( 'numero', { header: 'Número' } ), 
    columnHelper.accessor ( 'parcela', { header: 'Parcela' } ),
    columnHelper.accessor ( 'codFornecedor', { header: () => <>Código<br/>Fornecedor</> } ),
    columnHelper.accessor ( 'codFormaDePag', { header: () => <>Código<br/>Forma de Pagamento</> } ),
    columnHelper.accessor (
      'dtBaixa',
      { header: 'Data da Baixa', cell: ( info ) => <InfoBlock>{ info.getValue() ? formatarData ( info.getValue()! ) : '—' }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtVencimento',
      { header: 'Vencimento', cell: ( info ) => <InfoBlock>{ info.getValue() ? formatarDataHora ( info.getValue()! ) : '—' }</InfoBlock> }
    ), 
    columnHelper.accessor ( 'valor', { header: 'Valor' } ),
    columnHelper.accessor ( 'juro', { header: 'Juro' } ),
    columnHelper.accessor ( 'desconto', { header: 'Desconto' } ),
    columnHelper.accessor ( 'multa', { header: 'Multa' } ),
    columnHelper.accessor ( 'valorBaixa', { header: 'Valor da Baixa', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor (
      'justificativaCancelamento',
      { header: 'Cancelamento',
        cell: ( info ) => (
          <InfoBlock>
            { info.getValue() ?? '—' }
          </InfoBlock>
        ), }
    ),
    columnHelper.accessor (
      'dtCriacao',
      { header: 'Criação', cell: ( info ) => <InfoBlock>{ formatarData ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor (
      'dtEdicao',
      { header: 'Edição', cell: ( info ) => <InfoBlock>{ formatarData ( info.getValue() ) }</InfoBlock> }
    ),
    columnHelper.accessor ( 'codUser', { header: 'Código Usuário', cell: ( info ) => info.getValue() ?? '-' } ),
    columnHelper.accessor ( 'isActive', { header: 'Status', cell: ( info ) => ( info.getValue() ? 'Ativo' : 'Inativo' ) } ),
    columnHelper.display ( {
      id:     'acoes',
      header: 'Ações',
      // Só consulta: a conta a pagar não é cancelada nem excluída por esta tela — ela cai
      // junto com o cancelamento da compra do mesmo documento.
      cell: ( { row } ) => (
        <GrupoBotoes>
          <Botao
            $variante="secundario"
            onClick={ ( evento ) => { evento.stopPropagation(); abrirForm ( row.original, 'consulta' ); } }
          >
            Consultar
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
        <h2>Contas a Pagar</h2>
        <GrupoBotoes>
          <Botao onClick={ () => abrirForm ( {} ) }>Nova Conta a Pagar</Botao>
        </GrupoBotoes>
      </Toolbar>

      <InputBusca
        placeholder="Buscar contas a pagar…"
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
              <tr key={ ChaveConta ( row.original ) }>
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
        <ContaPagamentoForm
          modo={ modoForm }
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
