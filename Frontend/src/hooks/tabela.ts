import { useState } from 'react';
import
{
  getSortedRowModel,
  type Row,
  type RowData,
  type RowModel,
  type SortingState,
  type Table,
} from '@tanstack/react-table';

// Aceita uma coluna ou várias (ordenação composta, na ordem informada).
export function useTabelaOrdenada ( colunasPadrao: string | string[] )
{
  const [ sorting, setSorting ] = useState < SortingState >
  (
    [ colunasPadrao ].flat().map ( ( id ) => ( { id, desc: false } ) )
  );

  return { sorting, setSorting };
}

function estaInativo < TData > ( row: Row < TData > )
{
  return ( row.original as { isActive?: boolean | null } ).isActive === false;
}

// Mantém a ordem relativa e só desloca os inativos para o fim.
function inativosAoFinal < TData > ( rows: Row < TData >[] )
{
  return [
    ...rows.filter ( ( row ) => !estaInativo ( row ) ),
    ...rows.filter ( ( row ) => estaInativo ( row ) ),
  ];
}

/**
 * Substitui o `getSortedRowModel` do TanStack Table: aplica a ordenação escolhida pelo
 * usuário e, em seguida, empurra os registros com `isActive = false` para o final da
 * lista (antes da paginação, então eles ficam nas últimas páginas). O resultado é
 * memorizado pelo modelo de origem para não recriar as linhas a cada renderização.
 */
export function getSortedRowModelInativosAoFinal < TData extends RowData > ()
{
  return ( table: Table < TData > ) =>
  {
    const ordenarLinhas = getSortedRowModel < TData > () ( table );
    let modeloAnterior: RowModel < TData > | undefined;
    let resultadoAnterior: RowModel < TData > | undefined;

    return () =>
    {
      const modelo = ordenarLinhas();

      if ( modelo !== modeloAnterior || !resultadoAnterior )
      {
        modeloAnterior    = modelo;
        resultadoAnterior =
        {
          rows:      inativosAoFinal ( modelo.rows ),
          flatRows:  inativosAoFinal ( modelo.flatRows ),
          rowsById:  modelo.rowsById,
        };
      }

      return resultadoAnterior;
    };
  };
}
