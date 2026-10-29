import { useEffect, useState } from 'react';
import
{
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table';
import { useTabelaOrdenada, getSortedRowModelInativosAoFinal } from '../../hooks/tabela';
import { Botao, GrupoBotoes } from '../botao/style';
import { ModalOverlay, ModalCard, AcoesBotoes } from '../modal/style';
import { Toolbar, InputBusca, Alerta } from '../pagina/style';
import { TabelaWrapper, Tabela, TrSelecionavel, RodapeTabela, Paginacao, PaginacaoInfo } from '../tabela/style';

interface Props < T >
{
  titulo:        string;
  placeholder:   string;
  carregar:      () => Promise < T[] >;
  service:       string;
  colunas:       ColumnDef < T, any >[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  chaveDe:       ( entidade: T ) => number;
  colunaPadrao:  string;
  onSelecionar:  ( entidade: T ) => void;
  onCancelar:    () => void;
}

// Consulta somente de seleção (busca + tabela + "Selecionar"), para os campos de consulta
// cujo cadastro completo não cabe dentro de outro formulário (ex.: produto, que exige
// categorias). Mesma aparência das consultas com cadastro embutido (ex.: FornecedorConsulta).
export function ConsultaSelecao < T > (
  { titulo, placeholder, carregar, colunas, chaveDe, colunaPadrao, onSelecionar, onCancelar }: Props < T >
)
{
  'use no memo';
  const [ dados, setDados ]             = useState < T[] > ( [] );
  const [ selecionada, setSelecionada ] = useState < T | null > ( null );
  const [ erro, setErro ]               = useState ( '' );
  const { sorting, setSorting }         = useTabelaOrdenada ( colunaPadrao );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  useEffect ( () =>
  {
    carregar().then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ ] );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable (
    {
      data:     dados,
      columns:  colunas,
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
    <ModalOverlay onClick={ onCancelar }>
      <ModalCard
        onClick={ ( evento ) => evento.stopPropagation() }
        style={ { maxWidth: '1100px', width: '95vw' } }
      >
        <Toolbar>
          <h3>{ titulo }</h3>
        </Toolbar>

        <InputBusca
          placeholder={ placeholder }
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
              {
                table.getRowModel().rows.map ( ( row ) => (
                  <TrSelecionavel
                    key={ row.id }
                    onClick={ () => setSelecionada ( row.original ) }
                    onDoubleClick={ () => onSelecionar ( row.original ) }
                    $selecionado={ selecionada !== null && chaveDe ( selecionada ) === chaveDe ( row.original ) }
                  >
                    {
                      row.getVisibleCells().map ( ( cell ) => (
                        <td key={ cell.id }>{ flexRender ( cell.column.columnDef.cell, cell.getContext() ) }</td>
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
              <Botao $variante="secundario" onClick={ () => table.previousPage() } disabled={ !table.getCanPreviousPage() }>
                ← Anterior
              </Botao>
              <PaginacaoInfo>
                Página { table.getState().pagination.pageIndex + 1 } de { table.getPageCount() } · { table.getFilteredRowModel().rows.length } itens
              </PaginacaoInfo>
              <Botao $variante="secundario" onClick={ () => table.nextPage() } disabled={ !table.getCanNextPage() }>
                Próxima →
              </Botao>
            </GrupoBotoes>
          </Paginacao>

          <AcoesBotoes style={ { marginTop: '1rem' } }>
            <Botao type="button" $variante="secundario" onClick={ onCancelar }>
              Cancelar
            </Botao>
            <Botao type="button" disabled={ !selecionada } onClick={ () => selecionada && onSelecionar ( selecionada ) }>
              Selecionar
            </Botao>
          </AcoesBotoes>
        </RodapeTabela>
      </ModalCard>
    </ModalOverlay>
  );
}
