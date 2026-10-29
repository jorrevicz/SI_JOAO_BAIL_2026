import { type Estado, estadosService } from '../../services/estados';
import { useEffect, useState } from 'react';
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
    Toolbar
} from '../cidades/style';
import { useTabelaOrdenada, getSortedRowModelInativosAoFinal } from '../../hooks/tabela';
import { Paginacao, TrSelecionavel, PaginacaoInfo } from '../paises/style';
import { formatarData } from '../../utils/formatters';
import { EstadoForm } from './EstadoForm';

interface Props
{
    onSelecionar: ( oEstado: Estado ) => void;
    onCancelar: () => void;
}

const columnHelper = createColumnHelper < Estado > ( );

export function EstadoConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ]         = useState < Estado[] > ( [] );
    const [ selecionado, setSel ]     = useState ( false );
    const [ estadoSel, setEstadoSel ] = useState < Estado | null > ( null );
    const [ edit, setEdit ]           = useState < Partial < Estado > | null > ( null );
    const [ erro, setErro ]           = useState ( '' );
    const { sorting, setSorting }     = useTabelaOrdenada ( 'estado' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () =>
        estadosService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const Excluir = async ( id: number ) =>
    {
        if ( !confirm ( 'Confirma a exclusão deste estado?' ) )
        {
            return;
        }
        setErro ( '' );

        try
        {
            await estadosService.remover ( id );

            if ( estadoSel?.codEstado === id )
            {
                setEstadoSel ( null );
            }

            Carregar();
        }
        catch ( err )
        {
            setErro ( ( err as Error ).message );
        }
    };

    const ToggleSel = async ( oEstado: Estado ) =>
    {
        if ( oEstado )
        {
            setEstadoSel ( oEstado );
            setSel ( true );
        }
        else
        {
            setEstadoSel ( null );
            setSel ( false );
        }
    }

    const columns = [
        columnHelper.accessor ( 'codEstado', { header: 'Código' } ),
        columnHelper.accessor ( 'codPais', { header: 'Código País' } ),
        columnHelper.accessor ( 'estado', { header: 'Estado' } ),
        columnHelper.accessor ( 'uf', { header: 'UF' } ),
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
                    <Botao
                        $variante="secundario"
                        onClick={ ( evento ) => { evento.stopPropagation(); setEdit ( row.original ); } }
                    >
                        Editar
                    </Botao>
                    <Botao
                        $variante="perigo"
                        onClick={ ( evento ) => { evento.stopPropagation(); Excluir ( row.original.codEstado ); } }
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
                        <h3>Selecionar Estado</h3>
                        <Botao onClick={ () => setEdit ( {} ) }>Novo Estado</Botao>
                    </Toolbar>

                    <InputBusca
                        placeholder='Buscar Estado..'
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
                                            $selecionado={ estadoSel?.codEstado == row.original.codEstado ? true : false }
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
                                onClick={ () => estadoSel && onSelecionar ( estadoSel ) }
                            >
                                Selecionar
                            </Botao>
                        </AcoesBotoes>
                    </RodapeTabela>
                </ModalCard>
            </ModalOverlay>
            {
                edit !== null && (
                    <EstadoForm
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
