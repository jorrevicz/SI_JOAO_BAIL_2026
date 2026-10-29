import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();

// Testes unitários: não acessam banco (services com o repositório mockado, cálculos e
// utilitários puros). Sem `globalSetup` — nenhum banco de teste é criado.
export default defineConfig({
  test: {
    include: [
      'src/**/*.service.test.ts',
      'src/**/*.calculo.test.ts',
      'src/__tests__/authMiddleware.test.ts',
      'src/__tests__/contaTotal.test.ts',
      'src/__tests__/documentoFiscal.test.ts',
      'src/__tests__/errorHandler.test.ts',
      'src/__tests__/validate.test.ts',
      'src/__tests__/withTransaction.test.ts',
    ],

    // Trava de segurança: o `sql` (postgres.js) conecta de forma preguiçosa, então um teste
    // unitário que tentasse usar o banco falharia aqui em vez de atingir o banco de desenvolvimento.
    env: { DATABASE_URL: 'postgres://teste-unitario-sem-banco:5432/invalido' },

    restoreMocks: true,
  },
});
