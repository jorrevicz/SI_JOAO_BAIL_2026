import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.espacamento.lg};

  h2 {
    font-size: ${({ theme }) => theme.tipografia.tamanho.xl};
    font-weight: 600;
    color: ${({ theme }) => theme.cores.texto};
  }
`;

export const InputBusca = styled.input`
  padding: ${({ theme }) => `${theme.espacamento.sm} ${theme.espacamento.md}`};
  border: 1px solid ${({ theme }) => theme.cores.borda};
  border-radius: ${({ theme }) => theme.borda.raio};
  font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
  color: ${({ theme }) => theme.cores.texto};
  background: ${({ theme }) => theme.cores.fundo};
  outline: none;
  min-width: 240px;
  transition: border-color 0.15s;
  margin-bottom: ${({ theme }) => theme.espacamento.md};

  &:focus {
    border-color: ${({ theme }) => theme.cores.primaria};
  }

  &::placeholder {
    color: ${({ theme }) => theme.cores.textoSecundario};
  }
`;

export const TooltipWrapper = styled.span`
  position: relative;
  display: inline-flex;

  &[data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(28, 33, 40, 0.92);
    color: #fff;
    font-size: 0.75rem;
    line-height: 1.4;
    padding: ${({ theme }) => `${theme.espacamento.xs} ${theme.espacamento.sm}`};
    border-radius: ${({ theme }) => theme.borda.raio};
    white-space: normal;
    text-align: center;
    max-width: 260px;
    pointer-events: none;
    opacity: 0;
    z-index: 20;
  }

  &[data-tooltip]:hover::after {
    opacity: 1;
  }
`;

export const Alerta = styled.p`
  color: ${({ theme }) => theme.cores.erro};
  background: ${({ theme }) => `${theme.cores.erro}12`};
  border: 1px solid ${({ theme }) => `${theme.cores.erro}40`};
  border-radius: ${({ theme }) => theme.borda.raio};
  padding: ${({ theme }) => `${theme.espacamento.sm} ${theme.espacamento.md}`};
  margin-bottom: ${({ theme }) => theme.espacamento.md};
  font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
`;

export const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.espacamento.xs};
  margin-bottom: ${({ theme }) => theme.espacamento.xs};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.cores.textoSecundario};

  span {
    color: ${({ theme }) => theme.cores.textoSecundario};
  }
`;

export const BreadcrumbLink = styled(Link)`
  color: ${({ theme }) => theme.cores.primaria};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const ContextoBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.espacamento.sm};
  padding: ${({ theme }) => `${theme.espacamento.sm} ${theme.espacamento.md}`};
  background: ${({ theme }) => `${theme.cores.primaria}12`};
  border: 1px solid ${({ theme }) => `${theme.cores.primaria}40`};
  border-radius: ${({ theme }) => theme.borda.raio};
  margin-bottom: ${({ theme }) => theme.espacamento.md};
  font-size: ${({ theme }) => theme.tipografia.tamanho.sm};
  color: ${({ theme }) => theme.cores.texto};
`;
