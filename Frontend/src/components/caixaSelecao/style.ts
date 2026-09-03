import styled from 'styled-components';

export const ContainerCaixaSelecao = styled.label<{ $desabilitado: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.espacamento.sm};
  cursor: ${({ $desabilitado }) => ( $desabilitado ? 'not-allowed' : 'pointer' )};
  opacity: ${({ $desabilitado }) => ( $desabilitado ? 0.4 : 1 )};
  user-select: none;
`;

export const InputCaixaSelecao = styled.input`
  width: 16px;
  height: 16px;
  cursor: inherit;
  accent-color: ${({ theme }) => theme.cores.primaria};
  flex-shrink: 0;
`;

// export const RotuloCaixaSelecao = styled.span`
//   font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
//   color: ${({ theme }) => theme.cores.texto};
// `;
