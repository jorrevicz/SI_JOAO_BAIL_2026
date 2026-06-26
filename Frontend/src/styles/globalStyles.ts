import { createGlobalStyle } from 'styled-components';

export const MainGlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font: ${({ theme }) => theme.tipografia.base};
    color: ${({ theme }) => theme.cores.texto};
    background: ${({ theme }) => theme.cores.fundo};
    -webkit-font-smoothing: antialiased;
  }

  body {
    min-height: 100vh;
  }

  a {
    color: inherit;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  input, select, textarea {
    font-family: inherit;
    font-size: inherit;
  }
`;

