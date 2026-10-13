import { useState } from 'react';
import { type SortingState } from '@tanstack/react-table';

// Aceita uma coluna ou várias (ordenação composta, na ordem informada).
export function useTabelaOrdenada ( colunasPadrao: string | string[] ) 
{
  const [ sorting, setSorting ] = useState < SortingState > 
  ( 
    [ colunasPadrao ].flat().map ( ( id ) => ( { id, desc: false } ) )
  );

  return { sorting, setSorting };
}
