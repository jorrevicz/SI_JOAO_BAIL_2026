import styled from 'styled-components';

// Reaproveita as peças já existentes (DRY) — overlay, faixa de erro global e erro por campo.
export { ModalOverlay } from '../modal/style';
export { Alerta } from '../pagina/style';
export { ErroCampo } from '../modal/style';

// Card largo, no mesmo tamanho usado nas telas de consulta ( max-width 1100px / width 95vw ).
export const CardFormulario = styled.div`
  background: ${ ( { theme } ) => theme.cores.fundo };
  border-radius: ${ ( { theme } ) => theme.borda.raio };
  box-shadow: 0 8px 24px rgba( 0, 0, 0, 0.15 );
  padding: ${ ( { theme } ) => theme.espacamento.xl };
  width: 95vw;
  max-width: 1100px;
  max-height: 90vh;
  overflow-y: auto;
`;

// Cabeçalho: título à esquerda, botão de fechar ( × ) à direita.
export const CabecalhoFormulario = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${ ( { theme } ) => theme.espacamento.lg };

  h3 {
    font-size: ${ ( { theme } ) => theme.tipografia.tamanho.lg };
    font-weight: 600;
    color: ${ ( { theme } ) => theme.cores.texto };
  }
`;

export const BotaoFechar = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: ${ ( { theme } ) => theme.tipografia.tamanho.xl };
  line-height: 1;
  color: ${ ( { theme } ) => theme.cores.textoSecundario };
  padding: 0;

  &:hover {
    color: ${ ( { theme } ) => theme.cores.texto };
  }
`;

// Corpo é o <form>: seções empilhadas com espaçamento generoso ( xl ) entre os blocos.
export const CorpoFormulario = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${ ( { theme } ) => theme.espacamento.xl };
`;

// Cada seção é um grid de 12 colunas; colapsa para 1 coluna no mobile ( RNF01 ).
export const Secao = styled.div`
  display: grid;
  grid-template-columns: repeat( 12, 1fr );
  column-gap: ${ ( { theme } ) => theme.espacamento.md };
  row-gap: ${ ( { theme } ) => theme.espacamento.md };

  @media ( max-width: 768px ) {
    grid-template-columns: 1fr;
  }
`;

// Célula do campo: ocupa `$colunas` colunas do grid; label acima, controle, erro abaixo.
export const Celula = styled.div < { $colunas: number } >`
  grid-column: span ${ ( { $colunas } ) => $colunas };
  display: flex;
  flex-direction: column;
  gap: ${ ( { theme } ) => theme.espacamento.xs };
  min-width: 0;

  label {
    font-size: ${ ( { theme } ) => theme.tipografia.tamanho.sm };
    font-weight: 500;
    color: ${ ( { theme } ) => theme.cores.texto };
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: ${ ( { theme } ) => `${ theme.espacamento.sm } ${ theme.espacamento.md }` };
    border: 1px solid ${ ( { theme } ) => theme.cores.borda };
    border-radius: ${ ( { theme } ) => theme.borda.raio };
    font-size: ${ ( { theme } ) => theme.tipografia.tamanho.sm };
    color: ${ ( { theme } ) => theme.cores.texto };
    background: ${ ( { theme } ) => theme.cores.fundo };
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: ${ ( { theme } ) => theme.cores.primaria };
    }

    &:disabled {
      background: ${ ( { theme } ) => theme.cores.fundoSecundario };
      color: ${ ( { theme } ) => theme.cores.textoSecundario };
      cursor: not-allowed;
      border-color: ${ ( { theme } ) => theme.cores.borda };
    }
  }

  textarea {
    resize: vertical;
    min-height: 96px;
    font-family: inherit;
  }

  @media ( max-width: 768px ) {
    grid-column: 1 / -1;
  }
`;

// Asterisco vermelho de campo obrigatório.
export const Obrigatorio = styled.span`
  color: ${ ( { theme } ) => theme.cores.erro };
  margin-left: ${ ( { theme } ) => theme.espacamento.xs };
`;

// Linha de ações ( Cancelar / Salvar ) alinhada à direita.
export const Acoes = styled.div`
  display: flex;
  gap: ${ ( { theme } ) => theme.espacamento.sm };
  justify-content: flex-end;
`;
