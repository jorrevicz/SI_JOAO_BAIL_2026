import { useEffect, useState } from 'react';
import { transportadorasService, type Transportadora } from '../../services/transportadoras';
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
import TransportadoraForm from './TransportadoraForm';

interface Props
{
    onSelecionar: ( oTransportadora: Transportadora ) => void;
    onCancelar:   () => void;
}

const columnHelper = createColumnHelper < Transportadora > ( );

export function TransportadoraConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ]           = useState < Transportadora[] > ( [] );
    const [ selecionado, setSel ]       = useState ( false );
    const [ transportadoraSel, setTransportadoraSel ] = useState < Transportadora | null > ( null );
    const [ edit, setEdit ]             = useState < Partial < Transportadora > | null > ( null );
    const [ erro, setErro ]             = useState ( '' );
    const { sorting, setSorting }       = useTabelaOrdenada ( 'transportadora' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () =>
        transportadorasService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const Excluir = async ( id: number ) =>
    {
        if ( !confirm ( 'Confirma a exclusão desta transportadora?' ) )
        {
            return;
        }
        setErro ( '' );

        try
        {
            await transportadorasService.remover ( id );

            if ( transportadoraSel?.codTransp === id )
            {
                setTransportadoraSel ( null );
            }

            Carregar();
        }
        catch ( err )
        {
            setErro ( ( err as Error ).message );
        }
    };

    const ToggleSel = async ( oTransportadora: Transportadora ) =>
    {
        if ( oTransportadora )
        {
            setTransportadoraSel ( oTransportadora );
            setSel ( true );
        }
        else
        {
            setTransportadoraSel ( null );
            setSel ( false );
        }
    }

    const columns = [
        columnHelper.accessor ( 'codTransp', { header: 'Código' } ),
        columnHelper.accessor ( 'transportadora', { header: 'Transportadora',
            cell: ( info ) => (
                <InfoBlock>
                    { info.getValue() }
                </InfoBlock>
            ), } ),
        columnHelper.accessor ( 'nomeFantasia', { header: 'Nome fantasia', cell: ( info ) => info.getValue() ?? '—' } ),
        columnHelper.accessor ( 'cpfCnpjTransp', { header: 'CPF / CNPJ', cell: ( info ) => info.getValue() ?? '—' } ),
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
                        onClick={ ( evento ) => { evento.stopPropagation(); Excluir ( row.original.codTransp ); } }
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
                        <h3>Selecionar Transportadora</h3>
                        <Botao onClick={ () => setEdit ( {} ) }>Nova Transportadora</Botao>
                    </Toolbar>

                    <InputBusca
                        placeholder='Buscar Transportadora..'
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
                                            $selecionado={ transportadoraSel?.codTransp == row.original.codTransp ? true : false }
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
                                onClick={ () => transportadoraSel && onSelecionar ( transportadoraSel ) }
                            >
                                Selecionar
                            </Botao>
                        </AcoesBotoes>
                    </RodapeTabela>
                </ModalCard>
            </ModalOverlay>
            {
                edit !== null && (
                    <TransportadoraForm
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
