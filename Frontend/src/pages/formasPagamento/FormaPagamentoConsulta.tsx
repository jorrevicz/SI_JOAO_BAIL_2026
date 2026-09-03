import { useEffect, useState } from 'react';
import { formasPagamentoService, type FormaPagamento } from '../../services/formasPagamento';
import
{
    useReactTable,
    createColumnHelper,
    type PaginationState,
    getCoreRowModel,
    getSortedRowModel,
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
    Toolbar
} from '../veiculos/style';
import { useTabelaOrdenada } from '../../hooks/tabela';
import { Paginacao, TrSelecionavel, PaginacaoInfo } from '../formasPagamento/style';
import { formatarData } from '../../utils/formatters';
import { FormaPagamentoForm } from './FormaPagamentoForm';

interface Props
{
    onSelecionar: ( oFormPag: FormaPagamento ) => void;
    onCancelar: () => void;
}

const columnHelper = createColumnHelper < FormaPagamento > ( );

export function FormaPagamentoConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ]         = useState < FormaPagamento[] > ( [] );
    const [ selecionado, setSel ]     = useState ( false );
    const [ formPagSel, setFormPagSel ] = useState < FormaPagamento | null > ( null );
    const [ edit, setEdit ]           = useState < Partial < FormaPagamento > | null > ( null );
    const [ erro, setErro ]           = useState ( '' );
    const { sorting, setSorting }     = useTabelaOrdenada ( 'formaDePag' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () =>
        formasPagamentoService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const Excluir = async ( id: number ) =>
    {
        if ( !confirm ( 'Confirma a exclusão desta forma de pagamento?' ) )
        {
            return;
        }
        setErro ( '' );

        try
        {
            await formasPagamentoService.remover ( id );

            if ( formPagSel?.codFormaDePag === id )
            {
                setFormPagSel ( null );
            }

            Carregar();
        }
        catch ( err )
        {
            setErro ( ( err as Error ).message );
        }
    };

    const ToggleSel = async ( oFormPag: FormaPagamento ) =>
    {
        if ( oFormPag )
        {
            setFormPagSel ( oFormPag );
            setSel ( true );
        }
        else
        {
            setFormPagSel ( null );
            setSel ( false );
        }
    }

    const columns = [
        columnHelper.accessor ( 'codFormaDePag', { header: 'Código' } ),
        columnHelper.accessor ( 'formaDePag', { header: 'Forma de Pagamento' } ),
        columnHelper.accessor (
            'prazoCompensacao',
            { header: 'Prazo (dias)', cell: ( info ) => info.getValue() ?? '—' }
        ),
        columnHelper.accessor (
            'dtCriacao',
            { header: 'Criação', cell: ( info ) => formatarData ( info.getValue() ) }
        ),
        columnHelper.accessor (
            'dtEdicao',
            { header: 'Edição', cell: ( info ) => formatarData ( info.getValue() ) }
        ),
        columnHelper.accessor ( 'codUser', { header: 'Código Usuário', cell: ( info ) => info.getValue() ?? '-' } ),
        columnHelper.accessor ( 'isActive', { header: 'Status' } ),
        columnHelper.display ( {
            id: 'acoes',
            header: 'Ações',
            cell: ( { row } ) => (
                <>
                    <Botao $variante="secundario" onClick={ () => setEdit ( row.original ) }>
                        Editar
                    </Botao>
                    <Botao $variante="perigo" onClick={ () => Excluir ( row.original.codFormaDePag ) }>
                        Excluir
                    </Botao>
                </>
            ) } 
        ),
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
    <>
    <ModalOverlay onClick={ onCancelar }>
        <ModalCard
            onClick={ ( evento ) => evento.stopPropagation() }
            style={ { maxWidth: '1100px', width: '95vw' } }
        >
            <Toolbar>
                <h3>Selecionar Forma de Pagamento</h3>
                <Botao onClick={ () => setEdit ( {} ) }>Nova Forma de Pagamento</Botao>
            </Toolbar>

            <InputBusca
                placeholder='Buscar Forma de Pagamento..'
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
                                        headerGroup.headers.map ( ( header ) =>
                                        (
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
                                    $selecionado={ formPagSel?.codFormaDePag == row.original.codFormaDePag ? true : false }
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
                        onClick={ () => formPagSel && onSelecionar ( formPagSel ) }
                    >
                        Selecionar
                    </Botao>
                </AcoesBotoes>
            </RodapeTabela>
        </ModalCard>
    </ModalOverlay>
    {
        edit !== null && (
            <FormaPagamentoForm
                inicial={ edit }
                onSalvo={ () =>
                {
                    setEdit ( null );
                    Carregar();
                }}
                onCancelar={ () => setEdit ( null ) }
            />
        )
    }
    </>
    );
}
