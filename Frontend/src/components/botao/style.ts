import styled from 'styled-components';

export const Botao = styled.button<{ $variante?: 'perigo' | 'secundario' }>`
  padding: ${({ theme }) => `${theme.espacamento.sm} ${theme.espacamento.md}`};
  border-radius: ${({ theme }) => theme.borda.raio};
  border: 1px solid transparent;
  font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;

  background: ${({ theme, $variante }) => {
    if ($variante === 'perigo') return theme.cores.erro;
    if ($variante === 'secundario') return 'transparent';
    return theme.cores.primaria;
  }};
  color: ${({ theme, $variante }) =>
    $variante === 'secundario' ? theme.cores.texto : '#fff'};
  border-color: ${({ theme, $variante }) =>
    $variante === 'secundario' ? theme.cores.borda : 'transparent'};

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const GrupoBotoes = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.espacamento.sm};
`;
