import styled from 'styled-components';

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

export const ModalCard = styled.div`
  background: ${({ theme }) => theme.cores.fundo};
  border-radius: ${({ theme }) => theme.borda.raio};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: ${({ theme }) => theme.espacamento.xl};
  width: 100%;
  max-width: 420px;

  h3 {
    font-size: ${({ theme }) => theme.tipografia.tamanho.lg};
    font-weight: 600;
    color: ${({ theme }) => theme.cores.texto};
    margin-bottom: ${({ theme }) => theme.espacamento.lg};
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.espacamento.md};
  margin-bottom: ${({ theme }) => theme.espacamento.lg};
`;

export const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.espacamento.xs};

  label {
    font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
    font-weight: 500;
    color: ${({ theme }) => theme.cores.texto};
  }

  input,
  select {
    padding: ${({ theme }) => `${theme.espacamento.sm} ${theme.espacamento.md}`};
    border: 1px solid ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.borda.raio};
    font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
    color: ${({ theme }) => theme.cores.texto};
    background: ${({ theme }) => theme.cores.fundo};
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: ${({ theme }) => theme.cores.primaria};
    }
  }
`;

export const AcoesBotoes = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.espacamento.sm};
  justify-content: flex-end;
`;

export const ErroCampo = styled.span`
  font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
  color: ${({ theme }) => theme.cores.erro};
`;
