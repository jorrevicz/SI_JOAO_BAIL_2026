import { type Categoria, categoriasService } from "../../services/categorias";
import { useEffect, useState } from "react";
import { 
    useReactTable, 
    createColumnHelper, 
    type PaginationState,
    getCoreRowModel,
    getSortedRowModel, 
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
    Toolbar } from "../categorias/style";
import { useTabelaOrdenada } from "../../hooks/tabela";
import { Paginacao, TrSelecionavel, PaginacaoInfo } from "../paises/style";
import { formatarData } from '../../utils/formatters';
import CategoriaForm from "./CategoriaForm";

interface Props
{
    onSelecionar: ( oCategoria: Categoria ) => void;
    onCancelar: () => void;
}

const columnHelper = createColumnHelper < Categoria >()

export function CategoriaConsulta ( { onSelecionar, onCancelar }: Props )
{
    'use no memo';
    const [ dados, setDados ] = useState < Categoria[] > ( [] );
    const [ selecionado, setSel ] = useState ( false );
    const [ categoriaSel, setCategoriaSel ] = useState < Categoria | null > ( null );
    const [ edit, setEdit ] = useState < Partial < Categoria > | null > ( null );
    const [ erro, setErro ] = useState ( '' );
    const { sorting, setSorting } = useTabelaOrdenada ( 'categoria' );
    const [ globalFilter, setGlobalFilter ] = useState ( '' );
    const [ pagination, setPagination ] = useState < PaginationState > ( { pageIndex: 0, pageSize: 25 } );

    const Carregar = () => categoriasService.listar ( ).then ( setDados ).catch ( ( err: Error ) => setErro ( err.message ) );

    useEffect ( () =>
    {
        Carregar();
    }, [ ] );

    const Excluir = async ( id: number ) =>
    {
        if ( !confirm ( 'Confirma a exclusão desta categoria?' ) )
        {
            return;
        }
        setErro ( '' );

        try
        {
            await categoriasService.remover ( id );

            if ( categoriaSel?.codCategoria === id )
            {
                setCategoriaSel ( null );
            }

            Carregar();
        }
        catch ( err )
        {
            setErro ( ( err as Error ).message );
        }
    };

    const ToggleSel = async ( oCategoria: Categoria ) => 
    {
        if ( oCategoria )
        {
            setCategoriaSel ( oCategoria );
            setSel ( true );
        }
        else
        {
            setCategoriaSel ( null );
            setSel ( false );
        }
    }

    const columns = [
        columnHelper.accessor ( 'codCategoria', { header: 'Código' } ),
        columnHelper.accessor ( 'categoria', { header: 'Categoria' } ),
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
                onClick={ ( evento ) => { evento.stopPropagation(); Excluir ( row.original.codCategoria ); } }
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
          data: dados,
          columns,
          state: { sorting, globalFilter, pagination },
          onSortingChange: setSorting,
          onGlobalFilterChange: setGlobalFilter,
          onPaginationChange: setPagination,
          getCoreRowModel: getCoreRowModel ( ),
          getSortedRowModel: getSortedRowModel ( ),
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
                        <h3>Selecionar Categoria</h3>
                        <Botao onClick={ () => setEdit ( {} ) }>Nova Categoria</Botao>
                    </Toolbar>

                    <InputBusca 
                        placeholder='Buscar Categoria..' 
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
                                            $selecionado = { categoriaSel?.codCategoria == row.original.codCategoria ? true : false }
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
                                    onClick={ () => categoriaSel && onSelecionar ( categoriaSel ) }
                                >
                                    Selecionar
                                </Botao>
                            </AcoesBotoes>
                    </RodapeTabela>
                </ModalCard>
            </ModalOverlay>
            { 
                edit !== null && (
                    <CategoriaForm
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