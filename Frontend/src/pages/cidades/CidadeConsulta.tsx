import { type Cidade, cidadesService } from "../../services/cidades";
import { useEffect, useState } from "react";
import { 
    useReactTable, 
    createColumnHelper, 
    type PaginationState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,  
} from "@tanstack/react-table";
import { 
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
    Toolbar } from "../cidades/style";
import { useTabelaOrdenada, getSortedRowModelInativosAoFinal } from "../../hooks/tabela";
import { Paginacao, TrSelecionavel, PaginacaoInfo } from "../paises/style";
import { formatarData } from '../../utils/formatters';
import { CidadeForm } from "./CidadeForm";

interface Props
{
    onSelecionar: ( oCidade: Cidade ) => void;
    onCancelar: () => void;
}

const columnHelper = createColumnHelper < Cidade >()

export function CidadeConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ] = useState < Cidade[] > ( [] );
    const [ selecionado, setSel ] = useState ( false );
    const [ cidadeSel, setCidadeSel ] = useState < Cidade | null > ( null );
    const [ edit, setEdit ] = useState < Partial < Cidade > | null > ( null );
    const [ erro, setErro ] = useState ( '' );
    const { sorting, setSorting } = useTabelaOrdenada ( 'cidade' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ] = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () => cidadesService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const Excluir = async ( id: number ) =>
    {
        if ( !confirm ( 'Confirma a exclusão desta cidade?' ) )
        {
            return;
        }
        setErro ( '' );

        try
        {
            await cidadesService.remover ( id );

            if ( cidadeSel?.codCidade === id )
            {
                setCidadeSel ( null );
            }

            Carregar();
        }
        catch ( err )
        {
            setErro ( ( err as Error ).message );
        }
    };

    const ToggleSel = async ( oCidade: Cidade ) => 
    {
        if ( oCidade )
        {
            setCidadeSel ( oCidade );
            setSel ( true );
        }
        else
        {
            setCidadeSel ( null );
            setSel ( false );
        }
    }

    const columns = [
        columnHelper.accessor ( 'codCidade', { header: 'Código' } ),
        columnHelper.accessor ( 'codEstado', { header: () => <>Código<br/>Estado</> } ),
        columnHelper.accessor ( 'cidade', { header: 'Cidade' } ),
        columnHelper.accessor (
          'ddd',
          { header: 'DDD', cell: ( info ) => info.getValue() ?? '—' }
        ),
        columnHelper.accessor (
          'dtCriacao',
          { header: 'Criação', cell: ( info ) => formatarData ( info.getValue() ) }
        ),
        columnHelper.accessor (
          'dtEdicao',
          { header: 'Edição', cell: ( info ) => formatarData ( info.getValue() ) }
        ),
        columnHelper.accessor ( 'codUser', { header: () => <>Código<br/>Usuário</>, cell: ( info ) => info.getValue() ?? '-' } ),
        columnHelper.accessor ( 'isActive', { header: 'Status' } ),
        columnHelper.display ( {
          id: 'acoes',
          header: 'Ações',
          cell: ( { row } ) => (
            <GrupoBotoes>
              <Botao $variante="secundario" onClick={ () => setEdit ( row.original ) }>
                Editar
              </Botao>
              <Botao $variante="perigo" onClick={ () => Excluir ( row.original.codCidade ) }>
                Excluir
              </Botao>
            </GrupoBotoes>
          ),
        } ),
      ];

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable (
        {
          data: dados,
          columns,
          state: { sorting, globalFilter, pagination },
          onSortingChange: setSorting,
          onGlobalFilterChange: setGlobalFilter,
          onPaginationChange: setPagination,
          getCoreRowModel: getCoreRowModel ( ),
          getSortedRowModel: getSortedRowModelInativosAoFinal ( ),
          getFilteredRowModel: getFilteredRowModel ( ),
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
                        <h3>Selecionar Cidade</h3>
                        <Botao onClick={ () => setEdit ( {} ) }>Nova Cidade</Botao>
                    </Toolbar>

                    <InputBusca 
                        placeholder='Buscar Cidade..' 
                        value={ globalFilter } 
                        onChange={ ( evento ) => setGlobalFilter ( evento.target.value ) }
                        autoFocus
                    />

                    { erro && <Alerta role='alert'>{ erro }</Alerta> }

                    <TabelaWrapper>
                        <Tabela>
                            <thead>
                                {
                                    table.getHeaderGroups().map ( ( headerGroup )  => (
                                        <tr key = { headerGroup.id }>
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
                                            key = { row.id }
                                            onClick={ () => ( ToggleSel ( row.original ) ) }
                                            $selecionado = { cidadeSel?.codCidade == row.original.codCidade ? true : false }
                                        >
                                            {
                                                row.getVisibleCells().map ( ( cell ) => (
                                                    <td
                                                        key={ cell.id }
                                                    >
                                                        { flexRender ( cell.column.columnDef.cell, cell.getContext() ) }
                                                    </td>
                                                ))
                                            }
                                        </TrSelecionavel>
                                    ) )
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
                                    onClick={ () => cidadeSel && onSelecionar ( cidadeSel ) }
                                >
                                    Selecionar
                                </Botao>
                            </AcoesBotoes>
                    </RodapeTabela>
                </ModalCard>
            </ModalOverlay>
            { 
                edit !== null && (
                    <CidadeForm
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