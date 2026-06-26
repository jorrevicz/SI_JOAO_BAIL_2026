import { useState } from 'react';
import { type SortingState } from '@tanstack/react-table';

export function useTabelaOrdenada ( colunaPadrao: string ) 
{
  const [ sorting, setSorting ] = useState < SortingState > 
  ( 
    [ { id: colunaPadrao, desc: false } ] 
  );

  return { sorting, setSorting };
}
