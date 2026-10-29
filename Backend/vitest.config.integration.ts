import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();

// Testes de integração: falam com o banco de teste (`<banco>_test`) — repositórios (cada
// teste em transação revertida) e rotas (`supertest` contra o Express, que comitam dados e
// os removem no `afterAll`). Ver `vitest.config.unit.ts` para os testes sem banco.
export default defineConfig({
  test: {
    include: [
      'src/**/*.repository.test.ts',
      'src/**/*.routes.test.ts',
      'src/__tests__/helpers/db-helper.test.ts',
      'src/__tests__/health.test.ts',
    ],

    // Cria, migra e descarta o banco `<banco>_test` (ver o arquivo).
    globalSetup: [ './src/__tests__/setup/globalSetup.ts' ],

    // Todos os arquivos compartilham o mesmo banco e os testes de rota comitam dados:
    // rodar em série evita colisões em colunas únicas (ex.: sigla/DDI de Países).
    fileParallelism: false,

    restoreMocks: true,
  },
});
