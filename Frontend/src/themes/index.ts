export const theme = {
  cores: {
    primaria: '#1f6feb',
    texto: '#1c2128',
    fundo: '#ffffff',
    borda: '#d0d7de',
    erro: '#cf222e',
    fundoSecundario: '#f6f8fa',
    textoSecundario: '#656d76',
  },
  espacamento: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  tipografia: {
    base: "16px/1.5 'Segoe UI', system-ui, sans-serif",
    tamanho: {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
    },
  },
  borda: {
    raio: '6px',
  },
  sombra: {
    card: '0 1px 3px rgba(0,0,0,0.08)',
  },
};

export type Theme = typeof theme;
