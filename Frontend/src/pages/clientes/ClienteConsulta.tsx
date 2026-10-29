import { useEffect, useState } from 'react';
import { clientesService, type Cliente } from '../../services/clientes';
import
{
    useReactTable,
    createColumnHelper,
    type PaginationState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import
{
    AcoesBotoes,
    Botao,
    GrupoBotoes,
    InputBusca,
    ModalCard,
    ModalOverlay,
    Alerta,
    RodapeTabela,
    Tabela,
    TabelaWrapper,
    Toolbar,
    Paginacao,
    PaginacaoInfo,
} from './style';
import { InfoBlock, TrSelecionavel } from '../../components/tabela/style';
import { useTabelaOrdenada, getSortedRowModelInativosAoFinal } from '../../hooks/tabela';
import { formatarData } from '../../utils/formatters';
import ClienteForm from './ClienteForm';

interface Props
{
    onSelecionar: ( oCliente: Cliente ) => void;
    onCancelar:   () => void;
}

const columnHelper = createColumnHelper < Cliente > ( );

export function ClienteConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ]           = useState < Cliente[] > ( [] );
    const [ selecionado, setSel ]       = useState ( false );
    const [ clienteSel, setClienteSel ] = useState < Cliente | null > ( null );
    const [ edit, setEdit ]             = useState < Partial < Cliente > | null > ( null );
    const [ erro, setErro ]             = useState ( '' );
    const { sorting, setSorting }       = useTabelaOrdenada ( 'cliente' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () =>
        clientesService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const Excluir = async ( id: number ) =>
    {
        if ( !confirm ( 'Confirma a exclusão deste cliente?' ) )
        {
            return;
        }
        setErro ( '' );

        try
        {
            await clientesService.remover ( id );

            if ( clienteSel?.codCliente === id )
            {
                setClienteSel ( null );
            }

            Carregar();
        }
        catch ( err )
        {
            setErro ( ( err as Error ).message );
        }
    };

    const ToggleSel = async ( oCliente: Cliente ) =>
    {
        if ( oCliente )
        {
            setClienteSel ( oCliente );
            setSel ( true );
        }
        else
        {
            setClienteSel ( null );
            setSel ( false );
        }
    }

    const columns = [
        columnHelper.accessor ( 'codCliente', { header: 'Código' } ),
        columnHelper.accessor ( 'cliente', { header: 'Cliente',
            cell: ( info ) => (
                <InfoBlock>
                    { info.getValue() }
                </InfoBlock>
            ), } ),
        columnHelper.accessor (
            'tipoPessoa',
            { header: 'Tipo Pessoa', cell: ( info ) => info.getValue() === 'FISICA' ? 'Física' : info.getValue() === 'JURIDICA' ? 'Jurídica' : '—' }
        ),
        columnHelper.accessor (
            'foneCl',
            { header: 'Telefone', cell: ( info ) => info.getValue() ?? '—' }
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
                        onClick={ ( evento ) => { evento.stopPropagation(); setEdit ( row.original ); } }
                    >
                        Editar
                    </Botao>
                    <Botao
                        $variante="perigo"
                        onClick={ ( evento ) => { evento.stopPropagation(); Excluir ( row.original.codCliente ); } }
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
            getSortedRowModel:     getSortedRowModelInativosAoFinal ( ),
            getFilteredRowModel:   getFilteredRowModel ( ),
            getPaginationRowModel: getPaginationRowModel ( ),
        }
    );

    return (
        <>
            <ModalOverlay onClick={ onCancelar }>
                <ModalCard
                    onClick={ ( evento ) => evento.stopPropagation() }
                    style={ { maxWidth: '1100px', width: '95vw' } }
                >
                    <Toolbar>
                        <h3>Selecionar Cliente</h3>
                        <Botao onClick={ () => setEdit ( {} ) }>Novo Cliente</Botao>
                    </Toolbar>

                    <InputBusca
                        placeholder='Buscar Cliente..'
                        value={ globalFilter }
                        onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
                        autoFocus
                    />

                    { erro && <Alerta role='alert'>{ erro }</Alerta> }

                    <TabelaWrapper>
                        <Tabela>
                            <thead>
                                {
                                    table.getHeaderGroups().map ( ( headerGroup ) => (
                                        <tr key={ headerGroup.id }>
                                            {
                                                headerGroup.headers.map ( ( header ) => (
                                                    <th
                                                        key={ header.id }
                                                        onClick={ header.column.getToggleSortingHandler() }
                                                    >
                                                        {
                                                            flexRender (
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )
                                                        }
                                                        {
                                                            header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''
                                                        }
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
                                            onClick={ () => ( ToggleSel ( row.original ) ) }
                                            $selecionado={ clienteSel?.codCliente == row.original.codCliente ? true : false }
                                        >
                                            {
                                                row.getVisibleCells().map ( ( cell ) => (
                                                    <td key={ cell.id }>
                                                        { flexRender ( cell.column.columnDef.cell, cell.getContext() ) }
                                                    </td>
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

                        <AcoesBotoes style={ { marginTop: '1rem' } }>
                            <Botao
                                type="button"
                                $variante="secundario"
                                onClick={ onCancelar }
                            >
                                Cancelar
                            </Botao>
                            <Botao
                                type="button"
                                disabled={ !selecionado }
                                onClick={ () => clienteSel && onSelecionar ( clienteSel ) }
                            >
                                Selecionar
                            </Botao>
                        </AcoesBotoes>
                    </RodapeTabela>
                </ModalCard>
            </ModalOverlay>
            {
                edit !== null && (
                    <ClienteForm
                        inicial={ edit }
                        onSalvo={ ( salvo ) =>
                        {
                            // Cadastro novo feito dentro da consulta já volta selecionado ao formulário de origem.
                            const novo = edit !== null && Object.keys ( edit ).length === 0;

                            setEdit ( null );

                            if ( novo )
                            {
                                onSelecionar ( salvo );
                                return;
                            }

                            Carregar();
                        }}
                        onCancelar={ () => setEdit ( null ) }
                    />
                )
            }
        </>
    );
}
