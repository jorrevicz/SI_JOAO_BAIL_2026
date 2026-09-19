import { useEffect, useState } from 'react';
import { procedimentosService, type Procedimento } from '../../services/procedimentos';
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
import ProcedimentoForm from './ProcedimentoForm';

interface Props
{
    onSelecionar: ( oProcedimento: Procedimento ) => void;
    onCancelar:   () => void;
}

const columnHelper = createColumnHelper < Procedimento > ( );

export function ProcedimentoConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ]             = useState < Procedimento[] > ( [] );
    const [ selecionado, setSel ]         = useState ( false );
    const [ procedimentoSel, setProcSel ] = useState < Procedimento | null > ( null );
    const [ edit, setEdit ]               = useState < Partial < Procedimento > | null > ( null );
    const [ erro, setErro ]               = useState ( '' );
    const { sorting, setSorting }         = useTabelaOrdenada ( 'procedimento' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () =>
        procedimentosService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const ToggleSel = ( oProcedimento: Procedimento ) =>
    {
        if ( oProcedimento )
        {
            setProcSel ( oProcedimento );
            setSel ( true );
        }
        else
        {
            setProcSel ( null );
            setSel ( false );
        }
    };

    const columns = [
        columnHelper.accessor ( 'codProcedimento', { header: 'Código' } ),
        columnHelper.accessor ( 'procedimento', { header: 'Procedimento' } ),
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
        <>
            <ModalOverlay onClick={ onCancelar }>
                <ModalCard
                    onClick={ ( evento ) => evento.stopPropagation() }
                    style={ { maxWidth: '700px', width: '95vw' } }
                >
                    <Toolbar>
                        <h3>Selecionar Procedimento</h3>
                        <Botao onClick={ () => setEdit ( {} ) }>Novo Procedimento</Botao>
                    </Toolbar>

                    <InputBusca
                        placeholder='Buscar procedimento..'
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
                                            $selecionado={ procedimentoSel?.codProcedimento === row.original.codProcedimento }
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
                                onClick={ () => procedimentoSel && onSelecionar ( procedimentoSel ) }
                            >
                                Selecionar
                            </Botao>
                        </AcoesBotoes>
                    </RodapeTabela>
                </ModalCard>
            </ModalOverlay>
            {
                edit !== null && (
                    <ProcedimentoForm
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
