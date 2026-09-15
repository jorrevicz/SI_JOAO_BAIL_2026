import { useEffect, useState } from 'react';
import { condicoesPagamentoService, type CondicaoPagamento } from '../../services/condicoesPagamento';
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
    Toolbar,
    Paginacao,
    PaginacaoInfo,
} from './style';
import { TrSelecionavel } from '../../components/tabela/style';
import { useTabelaOrdenada } from '../../hooks/tabela';
import { formatarData } from '../../utils/formatters';
import CondicaoPagamentoForm from './CondicaoPagamentoForm';

interface Props
{
    onSelecionar: ( oCondPag: CondicaoPagamento ) => void;
    onCancelar: () => void;
}

const columnHelper = createColumnHelper < CondicaoPagamento > ( );

export function CondicaoPagamentoConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ]           = useState < CondicaoPagamento[] > ( [] );
    const [ selecionado, setSel ]       = useState ( false );
    const [ condPagSel, setCondPagSel ] = useState < CondicaoPagamento | null > ( null );
    const [ edit, setEdit ]             = useState < Partial < CondicaoPagamento > | null > ( null );
    const [ erro, setErro ]             = useState ( '' );
    const { sorting, setSorting }       = useTabelaOrdenada ( 'descricao' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () =>
        condicoesPagamentoService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const Excluir = async ( id: number ) =>
    {
        if ( !confirm ( 'Confirma a exclusão desta condição de pagamento?' ) )
        {
            return;
        }
        setErro ( '' );

        try
        {
            await condicoesPagamentoService.remover ( id );

            if ( condPagSel?.codCondDePag === id )
            {
                setCondPagSel ( null );
            }

            Carregar();
        }
        catch ( err )
        {
            setErro ( ( err as Error ).message );
        }
    };

    const ToggleSel = async ( oCondPag: CondicaoPagamento ) =>
    {
        if ( oCondPag )
        {
            setCondPagSel ( oCondPag );
            setSel ( true );
        }
        else
        {
            setCondPagSel ( null );
            setSel ( false );
        }
    }

    const columns = [
        columnHelper.accessor ( 'codCondDePag', { header: 'Código' } ),
        columnHelper.accessor ( 'descricao', { header: 'Descrição', cell: ( info ) => info.getValue() ?? '—' } ),
        columnHelper.accessor (
            'juroCondPag',
            { header: 'Juros (%)', cell: ( info ) => info.getValue() != null ? parseFloat ( info.getValue()! ).toFixed ( 2 ) + '%' : '—' }
        ),
        columnHelper.accessor (
            'multaCondPag',
            { header: 'Multa (%)', cell: ( info ) => info.getValue() != null ? parseFloat ( info.getValue()! ).toFixed ( 2 ) + '%' : '—' }
        ),
        columnHelper.accessor (
            'descontoCondPag',
            { header: 'Desconto (%)', cell: ( info ) => info.getValue() != null ? parseFloat ( info.getValue()! ).toFixed ( 2 ) + '%' : '—' }
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
                <GrupoBotoes>
                    <Botao $variante="secundario" onClick={ () => setEdit ( row.original ) }>
                        Editar
                    </Botao>
                    <Botao $variante="perigo" onClick={ () => Excluir ( row.original.codCondDePag ) }>
                        Excluir
                    </Botao>
                </GrupoBotoes>
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
                <h3>Selecionar Condição de Pagamento</h3>
                <Botao onClick={ () => setEdit ( {} ) }>Nova Condição de Pagamento</Botao>
            </Toolbar>

            <InputBusca
                placeholder='Buscar Condição de Pagamento..'
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
                                    $selecionado={ condPagSel?.codCondDePag == row.original.codCondDePag ? true : false }
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
                        onClick={ () => condPagSel && onSelecionar ( condPagSel ) }
                    >
                        Selecionar
                    </Botao>
                </AcoesBotoes>
            </RodapeTabela>
        </ModalCard>
    </ModalOverlay>
    {
        edit !== null && (
            <CondicaoPagamentoForm
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
