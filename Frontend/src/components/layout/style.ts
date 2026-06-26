import styled from 'styled-components';

export const Shell = styled.div`
  display: flex;
  min-height: 100vh;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const Sidebar = styled.aside`
  width: 220px;
  min-height: 100vh;
  background: ${({ theme }) => theme.cores.fundoSecundario};
  border-right: 1px solid ${({ theme }) => theme.cores.borda};
  padding: ${({ theme }) => theme.espacamento.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.espacamento.lg};

  h1 {
    font-size: ${({ theme }) => theme.tipografia.tamanho.md};
    font-weight: 600;
    color: ${({ theme }) => theme.cores.texto};
    white-space: nowrap;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamento.xs};
  }

  a {
    display: block;
    padding: ${({ theme }) => theme.espacamento.sm} ${({ theme }) => theme.espacamento.md};
    border-radius: ${({ theme }) => theme.borda.raio};
    color: ${({ theme }) => theme.cores.textoSecundario};
    text-decoration: none;
    font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: ${({ theme }) => theme.cores.borda};
      color: ${({ theme }) => theme.cores.texto};
    }

    &.active {
      background: ${({ theme }) => theme.cores.primaria}18;
      color: ${({ theme }) => theme.cores.primaria};
      font-weight: 500;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    min-height: auto;
    flex-direction: row;
    align-items: center;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.cores.borda};
    padding: ${({ theme }) => theme.espacamento.md};

    nav {
      flex-direction: row;
      flex-wrap: wrap;
      gap: ${({ theme }) => theme.espacamento.sm};
    }
  }
`;

export const Conteudo = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.espacamento.lg};
  overflow-y: auto;
`;
