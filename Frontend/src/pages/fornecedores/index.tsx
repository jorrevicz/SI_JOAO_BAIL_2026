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
import { fornecedoresService, type Fornecedor } from '../../services/fornecedores';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta,
} from './style';
// import BotaoConsultar from '../../components/botaoConsultar';
import FornecedorForm from './FornecedorForm';
import { InfoBlock } from '../../components/tabela/style';

const columnHelper = createColumnHelper < Fornecedor >();

export default function FornecedoresPage ()
{
  'use no memo';
  const [ dados, setDados ]       = useState < Fornecedor[] > ( [] );
  const [ editando, setEditando ] = useState < Partial < Fornecedor > | null > ( null );
  const [ erro, setErro ]         = useState ( '' );
  const { sorting, setSorting }   = useTabelaOrdenada ( 'fornecedor' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );
  // const [ codFornSel, setCodFornSel ] = useState < number | null > ( null )
  // const [ fornSel, setFornSel ] = useState('')

  const carregar = () =>
    fornecedoresService.listar ( )
      .then ( setDados )
      .catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () =>
  {
    carregar();
  }, [ ] );

  const excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão deste fornecedor?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await fornecedoresService.remover ( id );
      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const columns = [
    columnHelper.accessor ( 'codForn', { header: 'Código' } ),
    columnHelper.accessor ( 'fornecedor', { header: 'Fornecedor',
      cell: ( info ) => (
        <InfoBlock>
          { info.getValue() }
        </InfoBlock>
      ), } ),
    columnHelper.accessor (
      'nomeFantasia',
      { header: 'Nome fantasia',
      cell: ( info ) => (
        <InfoBlock>
          { info.getValue() }
        </InfoBlock>
      ), }
    ),
    columnHelper.accessor (
      'tipoPessoa',
      { header: 'Tipo Pessoa', cell: ( info ) => info.getValue() === 'FISICA' ? 'Física' : info.getValue() === 'JURIDICA' ? 'Jurídica' : '—' }
    ),
    columnHelper.accessor (
      'codCidade',
      { header: 'Código Cidade' }
    ),
    columnHelper.accessor ( 'codCondDePag', { header: () => <>Código<br/>Condição de Pagamento</> } ),
    columnHelper.accessor ( 'enderecoForn', { header: 'Endereço',
      cell: ( info ) => (
        <InfoBlock>
          { info.getValue() }
        </InfoBlock>
      ), } ),
    columnHelper.accessor ( 'bairroForn', { header: 'Bairro', 
      cell: ( info ) => (
        <InfoBlock>
          { info.getValue() }
        </InfoBlock>
      ), } ),
    columnHelper.accessor ( 'cepForn', { header: 'CEP', cell: ( info ) => info.getValue() ?? '-' } ),
    columnHelper.accessor (
        'foneForn',
        { header: 'Telefone', cell: ( info ) => info.getValue() ?? '—' }
      ),
    columnHelper.accessor (
      'cpfCnpjForn',
      { header: 'CPF / CNPJ', cell: ( info ) => info.getValue() ?? '—' }
    ),
    columnHelper.accessor ( 'inscEstSubTrib', { header: 'Inscrição estadual tributária', cell: ( info ) => info.getValue() ?? '-' } ),
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
        <>
          <Botao
            $variante="secundario"
            onClick={ ( evento ) => { evento.stopPropagation(); setEditando ( row.original ); } }
          >
            Editar
          </Botao>
          <Botao
            $variante="perigo"
            onClick={ ( evento ) => { evento.stopPropagation(); excluir ( row.original.codForn ); } }
          >
            Excluir
          </Botao>
        </>
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
        <h2>Fornecedores</h2>
        <GrupoBotoes>
          {/* <BotaoConsultar rota="/transportadoras" params={{ codForn: codFornSel, fornecedor: fornSel}}>
              Consultar Transportadoras
            </BotaoConsultar> */}
          <Botao onClick={ () => setEditando ( {} ) }>Novo Fornecedor</Botao>
        </GrupoBotoes>
      </Toolbar>

      <InputBusca
        placeholder="Buscar fornecedores…"
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
              <tr
                key={ row.id }
              >
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
        <FornecedorForm
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
