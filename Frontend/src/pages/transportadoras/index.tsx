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
import { transportadorasService, type Transportadora } from '../../services/transportadoras';
import {
  Toolbar, GrupoBotoes, Botao, InputBusca,
  TabelaWrapper, Tabela, RodapeTabela, Paginacao, PaginacaoInfo, Alerta, 
} from './style';
import TransportadoraForm from './TransportadoraForm';
import { InfoBlock } from '../../components/tabela/style';

const columnHelper = createColumnHelper < Transportadora >();

export default function TransportadorasPage ()
{
  'use no memo';  
  const [ dados, setDados ]       = useState < Transportadora[] > ( [] );
  const [ editando, setEditando ] = useState < Partial < Transportadora > | null > ( null );
  const [ erro, setErro ]         = useState ( '' );
  const { sorting, setSorting }   = useTabelaOrdenada ( 'transportadora' );
  const [ globalFilter, setGlobalFilter ] = useState ( '' );
  const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

  const carregar = () =>
    transportadorasService.listar( )
      .then ( setDados )
      .catch ( ( err: Error ) => setErro ( err.message ) );

  useEffect ( () => { carregar(); }, [ ] );

  const excluir = async ( id: number ) =>
  {
    if ( !confirm ( 'Confirma a exclusão desta transportadora?' ) )
    {
      return;
    }
    setErro ( '' );

    try
    {
      await transportadorasService.remover ( id );

      carregar();
    }
    catch ( err )
    {
      setErro ( ( err as Error ).message );
    }
  };

  const columns = [
    columnHelper.accessor ( 'codTransp', { header: 'Código' } ),
    columnHelper.accessor ( 
      'transportadora', 
      { 
        header: 'Transportadora', 
        cell: ( info ) => ( 
          <InfoBlock>
            { info.getValue() }
          </InfoBlock> 
        ) 
      } 
    ),
    columnHelper.accessor (
      'nomeFantasia',
      { 
        header: 'Nome fantasia', 
        cell: ( info ) => ( 
          <InfoBlock>
            { info.getValue() ?? '—' }
          </InfoBlock>
        )
      }
    ),
    columnHelper.accessor (
      'tipoPessoa',
      { header: 'Tipo Pessoa', cell: ( info ) => info.getValue() === 'FISICA' ? 'Física' : info.getValue() === 'JURIDICA' ? 'Jurídica' : '—' }
    ),
    columnHelper.accessor ( 'codCidade', { header: 'Código Cidade' } ),
    columnHelper.accessor ( 
      'enderecoTransp', 
      { 
        header: 'Endereço', cell: ( info ) => (
          <InfoBlock>
            { info.getValue() ?? '-' }
          </InfoBlock>
        )
      } 
    ),
    columnHelper.accessor ( 'codVeiculo', { header: 'Código Veículo' } ), 
    columnHelper.accessor (
      'cpfCnpjTransp',
      { header: 'CPF / CNPJ', cell: ( info ) => info.getValue() ?? '—' }
    ),
    columnHelper.accessor ( 'inscEstTransp', { header: 'Inscrição Estadual' } ),
    columnHelper.accessor ( 'cepTransp', { header: 'CEP', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor ( 'bairroTransp', { header: 'Bairro', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor ( 'foneTransp', { header: 'Telefone', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor ( 'email', { header: 'E-mail', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor ( 'apelido', { header: 'Apelido', cell: ( info ) => info.getValue() ?? '—' } ),
    columnHelper.accessor ( 'rg', { header: 'RG', cell: ( info ) => info.getValue() ?? '—' } ),
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
        <GrupoBotoes>
          <Botao
            $variante="secundario"
            onClick={ ( evento ) => { evento.stopPropagation(); setEditando ( row.original ); } }
          >
            Editar
          </Botao>
          <Botao
            $variante="perigo"
            onClick={ ( evento ) => { evento.stopPropagation(); excluir ( row.original.codTransp ); } }
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
        <h2>Transportadoras</h2>
      
          <Botao onClick={ () => setEditando ( { } ) } >
            Nova Transportadora
          </Botao>
      </Toolbar>

      <InputBusca
        placeholder="Buscar transportadoras…"
        value={ globalFilter }
        onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
      />

      { erro && <Alerta role="alert">{ erro }</Alerta> }

      <TabelaWrapper>
        <Tabela>
          <thead>
            { 
              table.getHeaderGroups().map ( ( headerGroup ) => (
                <tr 
                  key={ headerGroup.id }
                >
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
                <tr
                  key={ row.id }
                >
                  { 
                    row.getVisibleCells().map ( ( cell ) => (
                      <td 
                        key={ cell.id }
                      >
                        { 
                          flexRender ( cell.column.columnDef.cell, cell.getContext() ) 
                        }
                      </td>
                    ))
                  }
                </tr>
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

      { editando !== null && (
        <TransportadoraForm
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
