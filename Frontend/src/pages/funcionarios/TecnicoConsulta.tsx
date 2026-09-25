import { useEffect, useState } from 'react';
import { funcionariosService, type Funcionario } from '../../services/funcionarios';
import { cargosService } from '../../services/cargos';
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

const NomeCargoNormalizado = ( nome: string ) =>
    nome.normalize ( 'NFD' ).replace ( /[̀-ͯ]/g, '' ).trim().toLowerCase();

interface Props
{
    onSelecionar: ( oFuncionario: Funcionario ) => void;
    onCancelar:   () => void;
}

const columnHelper = createColumnHelper < Funcionario > ( );

export function TecnicoConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ]               = useState < Funcionario[] > ( [] );
    const [ selecionado, setSel ]           = useState ( false );
    const [ funcionarioSel, setFuncSel ]    = useState < Funcionario | null > ( null );
    const [ erro, setErro ]                 = useState ( '' );
    const { sorting, setSorting }           = useTabelaOrdenada ( 'funcionario' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ]     = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () =>
        Promise.all ( [ funcionariosService.listar ( { limit: 100 } ), cargosService.listar ( { limit: 100 } ) ] )
            .then ( ( [ funcionarios, cargos ] ) =>
            {
                const codigosTecnico = new Set
                (
                    cargos
                        .filter ( ( cargo ) => NomeCargoNormalizado ( cargo.cargo ) === 'tecnico' )
                        .map ( ( cargo ) => cargo.codCargo )
                );

                setDados ( funcionarios.filter ( ( funcionario ) => codigosTecnico.has ( funcionario.codCargo ) ) );
            } )
            .catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const ToggleSel = ( oFuncionario: Funcionario ) =>
    {
        if ( oFuncionario )
        {
            setFuncSel ( oFuncionario );
            setSel ( true );
        }
        else
        {
            setFuncSel ( null );
            setSel ( false );
        }
    };

    const columns = [
        columnHelper.accessor ( 'codFuncionario', { header: 'Código' } ),
        columnHelper.accessor ( 'funcionario', { header: 'Técnico' } ),
        columnHelper.accessor ( 'funcFone', { header: 'Telefone' } ),
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
        <ModalOverlay onClick={ onCancelar }>
            <ModalCard
                onClick={ ( evento ) => evento.stopPropagation() }
                style={ { maxWidth: '700px', width: '95vw' } }
            >
                <Toolbar>
                    <h3>Selecionar Técnico</h3>
                </Toolbar>

                <InputBusca
                    placeholder='Buscar técnico..'
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
                                        $selecionado={ funcionarioSel?.codFuncionario === row.original.codFuncionario }
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
                            onClick={ () => funcionarioSel && onSelecionar ( funcionarioSel ) }
                        >
                            Selecionar
                        </Botao>
                    </AcoesBotoes>
                </RodapeTabela>
            </ModalCard>
        </ModalOverlay>
    );
}
