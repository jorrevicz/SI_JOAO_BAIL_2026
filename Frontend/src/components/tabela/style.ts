import styled from 'styled-components';

export const TabelaWrapper = styled.div`
  border-radius: ${ ( { theme } ) => theme.borda.raio };
  box-shadow: ${ ( { theme } ) => theme.sombra.card };
  overflow: auto;
  height: clamp(400px, 65vh, 900px);
`;

export const Tabela = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${ ( { theme } ) => theme.cores.fundo };

  th,
  td {
    padding: ${ ( { theme } ) => `${ theme.espacamento.sm } ${ theme.espacamento.md }` };
    text-align: left;
    border-bottom: 1px solid ${ ( { theme } ) => theme.cores.borda };
    font-size: ${ ( { theme } ) => theme.tipografia.tamanho.sm };
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${ ( { theme } ) => theme.cores.fundoSecundario };
    font-weight: 600;
    color: ${ ( { theme } ) => theme.cores.texto };
    cursor: pointer;
    user-select: none;
    white-space: nowrap;

    &:hover {
      background: ${ ( { theme } ) => theme.cores.borda };
    }
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: ${ ( { theme } ) => theme.cores.fundoSecundario };
  }

  td:last-child {
    display: flex;
    gap: ${ ( { theme } ) => theme.espacamento.sm };
  }
`;

export const TrSelecionavel = styled.tr < { $selecionado?: boolean } >`
  cursor: pointer;

  ${
    ( 
      { 
        theme, 
        $selecionado 
      } 
    ) => $selecionado && `background: ${theme.cores.primaria}20 !important;`
  }
`;

export const RodapeTabela = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${ ( { theme } ) => theme.espacamento.sm };
`;

export const Paginacao = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.espacamento.sm};
`;

export const PaginacaoInfo = styled.span`
  font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
  color: ${({ theme }) => theme.cores.textoSecundario};
  white-space: nowrap;
`;
