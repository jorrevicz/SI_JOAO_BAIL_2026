# CLAUDE.md

Guia para o Claude Code ao trabalhar neste repositório. Leia antes de gerar ou alterar código.

## O que é este projeto

Sistema de gestão (ERP enxuto) para a **Kaneko Informática** — empresa de
assistência técnica e revenda de produtos de informática, sem sistema prévio.
Operação central: **Ordem de Serviço (OS)** — ciclo completo de recebimento,
diagnóstico, reparo e entrega de equipamentos. Módulos de suporte: cadastro,
compra e financeiro. Web API REST + SPA.

> **Estado atual (Fase 1 concluída):**
> Fase 0 (EP-00 a EP-03) e EP-13 (Prisma → postgres.js + node-pg-migrate + kanel) concluídos:
> schema migrado em formas normais, seed idempotente e infraestrutura base (`AppError`,
> `errorHandler`, `withTransaction`, `authMiddleware` stub, `validate`).
>
> **EP-04 — Cadastros geográficos (Países, Estados, Cidades) concluído:** CRUDs no backend em
> 4 camadas (`schema → controller → service → repository → routes`), com testes de service,
> repository (rollback) e rota (`supertest`); migration de índices únicos `Paises(ddi)` e
> `Estados(codPais, uf)` (`23505` → 409 PT). **Frontend bootstrapado (EP-11)** — Vite + React +
> TS + styled-components + React Router + axios — e **telas geográficas (T-113)** entregues
> (TanStack Table, navegação hierárquica por query params, formulários em modal).
>
> **Validação de formulários backend-driven:** o Backend (Zod) é a única fonte de verdade; a
> resposta 400 traz `erros: { campo: mensagem }` e o Frontend mapeia por campo via `ApiError`
> (sem duplicar schema/Zod no Frontend) — ver
> [docs/ref/validacao-frontend-backend-driven.md](docs/ref/validacao-frontend-backend-driven.md).
>
> **EP-05 — Catálogo (Lote 2A) concluído:** Categorias e Produtos com CRUDs em 4 camadas,
> testes (service, repository com rollback, routes supertest) e telas frontend (tabela com
> navegação hierárquica Categorias → Produtos por query param, formulário em modal com
> seleção de categoria). NCM/SH foi **descartada** (classificação fiscal/tributária fora de escopo).
>
> **Produto ↔ Categoria é N:N:** a FK 1:N `Produtos.codCategoria` foi removida; o vínculo vive
> na associativa `ProdutoCategoria` (FKs puras, sem auditoria, remoção física), exposta pelo
> módulo `produto-categorias` (`GET /api/produto-categorias?codProduto=N`). O produto exige
> **ao menos uma** categoria e a lista é gerenciada de forma embutida e atômica dentro do
> formulário de produto — mesmo padrão de Condição de Pagamento × Parcelas, porém com
> reconciliação por **diferença de conjuntos** (o vínculo não tem payload além das duas FKs).
>
> **`ClassificacoesCompra`:** domínio fechado (`obra-prima`, `revenda`, `serviços`) semeado
> pelo seed, referenciado por `Compras.codClassificacaoCompra` (FK obrigatória, RN005). Não
> reaproveita `Categorias` — aquela é taxonomia aberta do catálogo, esta sustenta regra de
> negócio. Só schema e seed por enquanto; o endpoint de leitura nasce com o módulo de Compras.
>
> **Lote 2B concluído:** Veículos, Fornecedores, Clientes e Transportadoras com CRUDs em
> 4 camadas, testes TDD (service unitário, repository rollback, routes supertest), soft delete,
> HasDependents multi-tabela e telas frontend (tabela + modal, selects de Cidades/Estados/Veículos
> carregados via API).
>
> **Lote 3 (Fase 3) concluído:** Condições de Pagamento, Formas de Pagamento e Parcelas com
> CRUDs em 4 camadas, testes TDD e telas frontend. Parcelas gerenciadas de forma embutida e
> atômica dentro do formulário de condição (reconciliação no `UpdateCondicao` via `WithTransaction`).
> **Regras de negócio do parcelamento** implementadas no Zod (`superRefine`): ao menos 1 parcela
> por condição (RN003), dias estritamente crescentes/distintos (RN004), à vista = 1 dia / 0 não
> permitido (RN005), soma dos percentuais = 100% (RN006). Frontend exibe total ao vivo e bloqueia
> "Salvar" enquanto o total ≠ 100% ou não há parcelas.
>
> **Regras de imutabilidade na edição (RN004/RN007/RN008):** `estoque` e `custoMedioProd` de
> Produtos, os custos de Condição de Pagamento (`juroCondPag`, `multaCondPag`, `descontoCondPag`)
> e o `prazoCompensacao` de Forma de Pagamento são definidos no cadastro e **não podem ser
> editados** — backend omite esses campos do schema de update; frontend exibe os campos travados
> (`disabled`/`readOnly`) na edição. Ver
> [docs/ref/campos-imutaveis-e-cadastro-vs-edicao.md](docs/ref/campos-imutaveis-e-cadastro-vs-edicao.md).
>
> **Fase 3B — backend de Contas a Pagar (RF11) e Contas a Receber (RF12) concluído:** CRUDs em
> 4 camadas com testes TDD para as duas entidades; chave primária natural composta (`numero`,
> `modelo`, `serie`, `parcela`), como em `Compras`; `RegistrarBaixa`/`Cancelar` são operações
> dedicadas (não passam pelo `Update`), com RN de bloqueio (não baixar conta cancelada, não
> cancelar conta já baixada). Ainda falta o frontend (T-115A).
>
> **Endurecimento de validação (campos obrigatórios e formato):** vários campos que eram
> opcionais viraram `NOT NULL` — `tipoPessoa`/`cepCl`/`foneCl` (Clientes), `modeloVeiculo`/
> `marca`/`codAntt` (Veículos), `tipoPessoa`/`cpfCnpjTransp`/`inscEstTransp` (Transportadoras),
> `tipoPessoa`/`cepForn`/`foneForn`/`cpfCnpjForn`/`inscEstSubTrib` (Fornecedores), `undProduto`/
> `pesoBruto`/`pesoLiq` (Produtos), `ddd` (Cidades), `ddi`/`moeda` (Países), `prazoCompensacao`
> (Forma de Pagamento) — com migration de backfill para dados pré-existentes. `juroCondPag`/
> `multaCondPag`/`descontoCondPag` continuam obrigatórios no Zod (o Backend só valida
> presença/formato); o Frontend é quem preenche com 0.00 quando o usuário deixa em branco.
> CEP e CPF/CNPJ passaram a exigir tamanho exato (8 e 11-ou-14 dígitos); telefone valida
> 10–15 dígitos puros (sem `+`), consistente com o princípio de
> [dados sem máscara no banco](docs/06-modelo-de-dados.md#princípios-de-modelagem). Corrigido
> também um typo de campo (`codFormaDepag` → `codFormaDePag`) em Contas a Pagar que impedia
> qualquer requisição correta de ser aceita.
>
> **Fase OS — Lote OS-A concluído (backend + frontend):** CRUD de Ordem de Serviço (abertura,
> consulta, diagnóstico) em 4 camadas com testes TDD. **A migration que criou o schema da
> Fase OS (`add-ordem-de-servico-tables`) já havia sido aplicada ao banco antes desta
> documentação** — o modelo original em `docs/05` (`codOS`, `status`, `valorTotal`, peças
> via `Produtos`) foi descartado e a documentação reescrita para refletir o schema real
> (`Aparelhos`, `Equipamentos`, `Procedimentos`, `OrdemDeServicos`, chave natural `numOdS`);
> ver nota de revisão em
> [docs/05 §8](docs/05-modelo-de-dominio.md#8-atendimento-ordem-de-serviço). A única
> correção sobre essa migration foi uma migration adicional
> (`ajustar-procedimentos-checklist-ods`) que move `posicao`/`checagem`/`obsProcedimento`/
> `dthFim` de `Procedimentos` para a nova associativa `ProcedimentosOdS` — um único
> `codProcedimento` no cabeçalho da OS não comporta a checklist de múltiplas checagens por
> atendimento. `abrirOS()` cria a OS e, na mesma transação (RNF06), os registros de
> `Aparelhos`/`Equipamentos` daquela unidade; `registrarDiagnosticoOS()` é operação
> dedicada que reconcilia a checklist por diferença de conjuntos (mesmo padrão de Condição
> de Pagamento × Parcelas). `Cargos`/`Funcionarios`/`Servicos`/`Pecas`/`ServicosOdS`/
> `OrcamentoPecasOdS`/`SubstituirPecasOdS` já existem no banco (mesma migration original)
> mas ainda sem camada de aplicação — entram no Lote OS-B.
>
> **Frontend do Lote OS-A concluído:** telas de `Procedimentos` (cadastro simples) e
> `Ordens de Serviço` (listagem com filtro por cliente, formulário de abertura com
> Aparelho/Equipamento embutidos, modal de diagnóstico dedicado com checklist de
> `ProcedimentosOdS` embutido e reconciliado) — mesmos padrões de UI já estabelecidos
> (`FormModal`/`FormSecao`/`FormCampo`, picker `Consulta` reaproveitado de `ClienteConsulta`,
> reconciliação embutida de `CondicaoPagamentoForm`/`ParcelaForm`).
>
> **Lote OS-B — backend de Execução (serviços e peças) e Aprovação concluído:** CRUDs
> em 4 camadas com testes TDD para `Cargos`, `Funcionarios`, `Servicos` e `Pecas`
> (mesmo padrão dos demais cadastros de apoio). Migration `adicionar-situacao-ordem-de-servico`
> acrescenta `situacao` (máquina de estados: `Aberta` → `Em execução` →
> `Aguardando aprovação` ⇄ `Em execução`, estados finais reservados para o Lote OS-C) —
> `tipoOdS` foi esclarecido na documentação como classificação livre da OS (não status).
> `registrarExecucaoOS()` reconcilia `ServicosOdS`/`OrcamentoPecasOdS` por diferença de
> conjuntos (mesmo padrão de `ProcedimentosOdS`); `aprovarOrcamentoPeca()`/
> `reprovarOrcamentoPeca()` decidem por item (reprovar = soft delete da linha);
> `registrarSubstituicaoPecasOS()` é lançamento manual do técnico, só aceito para peça
> orçada e aprovada, reconciliado pela mesma filosofia de Parcelas × Condição de
> Pagamento.
>
> **Fases de Diagnóstico e Execução reorganizadas (backend + frontend):** por decisão do
> responsável pelo projeto, o orçamento de peças (`OrcamentoPecasOdS`) passou a nascer
> junto do **diagnóstico** — é na inspeção que o técnico identifica o que precisa ser
> trocado e já cota o valor — e as observações técnicas (`obsTecnica`) passaram a ser
> registradas ao fim da **execução**, depois que o trabalho foi concluído (antes era o
> inverso). `registrarDiagnosticoOS()` agora reconcilia `ProcedimentosOdS` **e**
> `OrcamentoPecasOdS`; `registrarExecucaoOS()` reconcilia `ServicosOdS` e atualiza
> `obsTecnica` (schema/service/repository e os 4 arquivos de teste do módulo
> `ordens-servico` foram ajustados). **`DiagnosticoModal`** exibe, nessa ordem,
> checklist de procedimentos → histórico de manutenção → orçamento de peças;
> **`ExecucaoModal`** exibe serviços efetuados → peças substituídas (agora com tela
> própria, ligada a `registrarSubstituicaoPecasOS()`, que já existia só no backend) →
> observações técnicas. O registro de serviço efetuado ganhou consulta de técnico
> (`TecnicoConsulta`, em `pages/funcionarios/`) que lista `Funcionarios` filtrados por
> `Cargos.cargo = 'Técnico'` (comparação normalizada, sem acento/maiúsculas) — mesmo
> padrão de `Consultar` + campos somente para verificação já usado em
> `ProcedimentoOdSForm`/`ClienteConsulta`; o técnico não é persistido em `ServicosOdS`
> (a tabela não tem essa coluna — ver [docs/05 §8](docs/05-modelo-de-dominio.md#servicosods-associativa-os--servico)),
> é só conferência no ato do lançamento.
>
> **Ainda fora deste lote:** telas de cadastro (CRUD completo) de `Cargos`,
> `Funcionarios`, `Servicos` e `Pecas` — só existem no backend; o frontend só tem o
> picker `TecnicoConsulta` (somente leitura) necessário para a Execução. A UI de
> aprovação/reprovação de orçamento de peças (`aprovarOrcamentoPeca()`/
> `reprovarOrcamentoPeca()`) também ainda não tem tela própria.
>
> **Datas de Contas a Pagar/Receber obrigatórias, com hora e fuso:** `dtEmissao` e
> `dtVencimento` de `ContasAPagar`/`ContasAReceber` eram opcionais e passaram a ser
> `NOT NULL` (migration `contas-datas-obrigatorias`, com backfill a partir de
> `dtCriacao` para os registros pré-existentes). Em seguida, as duas colunas passaram de
> `Timestamp(3)` (sem fuso) para `TimestampTz(3)` (migration `contas-datas-com-timezone`)
> — o valor gravado como "sem fuso" dependia implicitamente do `TimeZone` da sessão para
> ser reinterpretado corretamente; `TimestampTz` grava o instante de forma inequívoca. A
> checagem cruzada no Zod (`superRefine`, mesmo padrão de `validarParcelas` em Condição
> de Pagamento) exige que `dtVencimento` seja **estritamente posterior** a `dtEmissao`
> — datas/horários iguais não são permitidos, mesmo no mesmo dia — não no Frontend, ver
> [docs/ref/validacao-frontend-backend-driven.md](docs/ref/validacao-frontend-backend-driven.md).
> `ContaPagamentoForm`/`ContaReceberForm` usam `<input type="datetime-local">` (data e
> hora, não só data) com `required` e `min` no campo de vencimento amarrado à emissão;
> na criação, a emissão nasce pré-preenchida com a data/hora atual (UTC) e o vencimento
> com o fim do dia de hoje (23:59 UTC) — combinação que já nasce válida.
>
> **Varredura de datas para `TimestampTz` + padrão brasileiro:** todas as colunas de
> data/hora do schema (não só Contas a Pagar/Receber) passaram de `Timestamp(3)` para
> `TimestampTz(3)` — migration `todas-datas-com-timezone`, um `DO` block que converte
> toda coluna `timestamp without time zone` de `information_schema.columns` (exceto
> `pgmigrations`, tabela interna do node-pg-migrate). O Backend continua
> retornando/recebendo ISO 8601 em UTC; o Frontend passou a formatar exibição no padrão
> brasileiro `DD-MM-AAAA` (`formatarData`) e `DD-MM-AAAA HH:mm` onde a hora importa
> (`formatarDataHora`), sempre a partir dos componentes UTC da data — nunca do fuso do
> navegador (`Frontend/src/utils/formatters.ts`). Os campos `datetime-local` de
> emissão/vencimento também usam esse truque (dígitos UTC no lugar de dígitos locais,
> via `paraDataHoraInputUtc`/`doInputUtcParaIso`), já que o widget nativo do navegador
> não tem modo UTC — ver [docs/06](docs/06-modelo-de-dados.md#princípios-de-modelagem).
>
> **`numOdS` revisado para UID gerado:** por decisão do responsável pelo projeto, a OS
> deixou de usar chave natural informada pelo requisitante (`CHAR(8)`, mesmo padrão de
> `Compras`/`ContasAPagar`/`ContasAReceber`, adotado no Lote OS-A) e passou a usar um UID
> gerado pelo banco (`UUID`, `DEFAULT gen_random_uuid()`) — migration
> `ordem-de-servico-numods-uuid` altera o tipo da coluna em `OrdemDeServicos` e nas
> quatro associativas (`ProcedimentosOdS`, `ServicosOdS`, `OrcamentoPecasOdS`,
> `SubstituirPecasOdS`); como só havia dado de seed/teste em ambiente local, as tabelas
> foram truncadas na migration (nada de produção a preservar). O schema Zod
> (`abrirOrdemServicoSchema`) não recebe mais `numOdS` — o campo de validação de
> comprimento/formato do número da OS foi removido do Backend, e o Frontend não tem
> mais campo de entrada nem o fluxo de "Validar Chave" (`OrdemServicoForm` agora libera
> os demais campos ao selecionar o cliente).
>
> **Próximo passo: telas de cadastro de Cargos/Funcionarios/Servicos/Pecas e a UI de
> aprovação/reprovação de orçamento de peças.**

## Fonte de verdade: leia `docs/` primeiro

A especificação arquitetural está em [`docs/`](docs/README.md), separada por escopo.
**Antes de implementar qualquer módulo, consulte os documentos relevantes:**

- Entidades, atributos e operações → [docs/05-modelo-de-dominio.md](docs/05-modelo-de-dominio.md)
- Estilo arquitetural, padrão da API, estratégia de testes, regras → [docs/02-arquitetura.md](docs/02-arquitetura.md)
- Tabelas, PK/FK, normalização → [docs/06-modelo-de-dados.md](docs/06-modelo-de-dados.md)
- O que cada módulo faz e suas regras → [docs/07-casos-de-uso.md](docs/07-casos-de-uso.md)
- Requisitos (RF/RNF) → [docs/04-requisitos.md](docs/04-requisitos.md)
- Ordem de construção → [docs/09-roadmap.md](docs/09-roadmap.md)
- Termos fiscais (CFOP, ICMS, IPI…) → [docs/10-glossario.md](docs/10-glossario.md)
- Princípios de engenharia complementares (o que adotar/dispensar) → [docs/12-principios-de-engenharia.md](docs/12-principios-de-engenharia.md)

Se uma alteração contradisser os `docs/`, **atualize os `docs/` junto** — eles devem
permanecer fiéis ao código.

## Stack

- **Linguagem:** TypeScript (backend e frontend).
- **Backend:** Node.js + Express; acesso a dados com **postgres.js** (driver SQL direto, sem ORM);
  migrations SQL com **node-pg-migrate**; tipos das tabelas gerados pelo **kanel**; validação **Zod v4**.
- **Frontend:** React + Vite; **styled-components** (CSS-in-JS, isolamento por componente); **TanStack Table** (tabelas headless com paginação, ordenação e filtragem); estado via **Context API**; **React Router**; cliente HTTP **axios**.
- **Testes:** **Vitest**.
- **Banco:** PostgreSQL (local: PostgreSQL 16).

Não introduza outras bibliotecas para o que a stack já cobre (ex.: não use Redux —
o estado é Context API; **não introduza ORM nem query builder** — o acesso a dados é SQL
direto via postgres.js; não use TailwindCSS — a estilização é styled-components; não use
AG Grid nem react-table diretamente — é TanStack Table). Detalhes e racional em
[docs/03-stack-tecnologica.md](docs/03-stack-tecnologica.md).

## Estrutura de diretórios

```
/Backend
  /DB                  → migrations SQL, seed
    /migrations        → migrations SQL versionadas (node-pg-migrate)
    seed.ts            → dados iniciais (idempotente, INSERT ... ON CONFLICT)
  /src                 → código-fonte da API
    /lib               → instância compartilhada do cliente postgres.js (`sql`)
    /db                → arquivos relacionados ao postgresql
      /migrations      → migrations feitas com postgre.js
      /types           → tipos das tabelas gerados pelo kanel (introspecção)
    /modules           → um subdiretório por subdomínio de negócio
      /health          → health check (health.routes.ts + health.controller.ts)
      /paises          → (EP-04, a criar)
      ...
    /shared            → utilitários transversais a todos os módulos
      /errors          → AppError (exceção de domínio com status HTTP)
      /middleware      → authMiddleware (stub) e errorHandler (central)
      /transaction     → withTransaction (wrapper de sql.begin)
      /validation      → validate (factory de middleware Zod)
    /types             → augmentações de tipos Express (codUser em Request)
    /__tests__         → testes Vitest (infraestrutura + integração de repositórios)
    app.ts             → instância Express (rotas e middlewares)
    server.ts          → bootstrap (escuta na porta; encerra `sql` no shutdown)
  kanel.config.cjs          → configuração do kanel (geração de tipos)
  database.config.json      → configuração do node-pg-migrate (migrations)
  package.json         → scripts de migrate/seed/types:gen; node-pg-migrate lê DATABASE_URL do .env
/Frontend
  /src                 → código-fonte da SPA React
    /assets            → arquivos estáticos (imagens, fontes, ícones)
    /components        → componentes reutilizáveis (cada um com index.tsx + style.js)
      /button          → exemplo: botão base (index.tsx, style.js)
    /hooks             → hooks React customizados compartilhados entre páginas
    /pages             → páginas por rota (cada uma com index.tsx + style.js)
      /home            → placeholder inicial (index.tsx, style.js)
    /services          → clientes HTTP (axios); um arquivo por domínio de API
      api.tsx          → instância axios configurada com a URL base
    /styles            → estilos globais
      globalStyles.js  → createGlobalStyle (reset e variáveis CSS globais)
    /themes            → tokens de design (cores, tipografia, espaçamentos)
    /utils             → funções utilitárias puras (formatação, validação, máscaras, etc.)
    main.tsx           → ponto de entrada React (monta a árvore e injeta globalStyles)
/docs          → base de conhecimento (NÃO é código; manter sincronizado)
```

Cada subdomínio do [modelo de domínio](docs/05-modelo-de-dominio.md)
(localização, parceiros, produtos, logística, financeiro, compras, fiscal, acesso)
vira um módulo no backend. Ver [docs/02-arquitetura.md](docs/02-arquitetura.md).

## Princípios obrigatórios

1. **POO** — modele o domínio em classes; mantenha regra de negócio nos *services*,
   fora de controllers e do transporte HTTP.
2. **Formas normais (até 3FN)** — relações N:N via tabelas associativas; sem colunas
   redundantes (ver pendências de normalização nos
   [docs de dados](docs/06-modelo-de-dados.md#princípios-de-modelagem)).
3. **REST** — recursos no plural, verbos HTTP semânticos, JSON. Padrão em
   [docs/02-arquitetura.md](docs/02-arquitetura.md#padrão-de-api-rest).
4. **Atomicidade** — compras, notas fiscais e contas rodam em transação com rollback
   via `withTransaction` (wrapper de `sql.begin` do postgres.js) — RNF06.
5. **Autenticação** — todo módulo exige usuário autenticado, exceto login/registro (RN001).
6. **Auditoria** — toda entidade tem `codUser`, `dtCriacao`, `dtEdicao`, `isActive`
   (soft delete); nunca apague registro com dependentes (RN002).
7. **Português** — mensagens de UI/erro, comentários e documentação em português.
8. **TDD** — ao criar ou modificar um *service* de backend, siga o ciclo
   Red → Green → Refactor:
   1. Escreva o teste (Vitest) que descreve o comportamento esperado — ele deve falhar.
   2. Implemente o mínimo de código no *service* para o teste passar.
   3. Refatore sem quebrar o teste.
   Testes de *service* são unitários (mockam o repositório); testes de rota são de
   integração (usam `supertest` contra a instância Express); testes de *repository* são de
   integração contra um banco de teste, cada um em transação revertida (rollback). Não
   avance para o próximo método/rota sem todos os testes anteriores passando.
9. **Acesso a dados seguro (postgres.js)** — SQL escrito à mão na camada de repositório:
   valores **sempre** por *tagged template* (`sql\`... ${valor}\``), nunca concatenados
   (defesa SQLi/RNF05); identificadores dinâmicos só por whitelist com `sql(coluna)`;
   consultas filtram `isActive = true` e "remoção" é soft delete; paginação por cursor
   sobre `codX` (sem `OFFSET`). Detalhes em
   [docs/02-arquitetura.md](docs/02-arquitetura.md#acesso-a-dados-postgresjs).

## Ordem de implementação (não pule etapas)

Conforme [docs/09-roadmap.md](docs/09-roadmap.md):

1. Banco primeiro (migrations SQL em formas normais via node-pg-migrate), depois **scripts de seed**.
2. **Backend-first por módulo** — ao concluir e testar o backend de um módulo/CRUD,
   construir imediatamente as telas do frontend correspondente antes de avançar para
   o próximo módulo. Não aguardar todo o backend estar pronto para iniciar o frontend.
3. CRUDs em **lotes de três**, começando pelos mais básicos
   (Países → Estados → Cidades, que são pré-requisito dos demais).
4. Dentro de cada CRUD, **consultas (GET/Read) primeiro**; só depois Create/Update/Delete.
5. Login e fluxos completos de compra/venda: **decisão adiada** — não implemente sem
   confirmar com o usuário.

## Convenções de nomenclatura

Os nomes oficiais de entidades/campos estão no
[modelo de domínio](docs/05-modelo-de-dominio.md). O diagrama original tem **erros de
grafia a corrigir na implementação** — use a forma correta:

| No diagrama | Use no código |
|-------------|---------------|
| `Forncedores` | `Fornecedores` |
| `Users.tenha` | `senha` |
| `adicionarProsutoNfe` | `adicionarProdutoNfe` |
| `cfoPfodNfe` | `cfopNfe` (CFOP) |
| `codUSer` | `codUser` |
| `adicionarPrdutoCategoria` | `adicionarProdutoCategoria` |

Identificadores de código (variáveis, funções, classes, métodos, rotas) são escritos em
**inglês**. Mensagens de UI/erro, campos do banco de dados, comentários e documentação permanecem em português.

### Nomes descritivos — proibido abreviar

Nunca use nomes de uma letra ou abreviações crípticas que dificultem a leitura. Dê a cada
variável, parâmetro e função um nome explícito que revele sua intenção (backend **e**
frontend). Exemplos do padrão adotado:

| Não use      | Use                  | Contexto                                   |
|--------------|----------------------|--------------------------------------------|
| `col`        | `columnHelper`       | helper de colunas do TanStack Table        |
| `hg`         | `headerGroup`        | grupo de cabeçalho ao iterar a tabela      |
| `h`          | `header`             | cabeçalho ao iterar                        |
| `r`          | `row`                | linha ao iterar                            |
| `c`          | `cell`               | célula ao iterar                           |
| `i`          | `info`               | contexto da célula (`cell: ( info ) =>`)   |
| `e`          | `evento`             | evento de DOM/React (`onChange`, `submit`) |
| `e` / `err`  | `err`                | erro capturado em `catch` (igual ao `errorHandler`) |
| `d`          | `dados`              | corpo enviado em chamadas de service       |
| `r`          | `resposta`           | resposta HTTP (`.then ( ( resposta ) => resposta.data )`) |
| `fmtData`    | `formatarData`       | função utilitária de formatação            |

Exceções consagradas e já estabelecidas no código: `req`, `res`, `next` (Express), `sql`
(cliente postgres.js), `id`, `repo`, `data` (camada de dados). Não invente novas abreviações
fora dessas.

### Indentação e espaçamento

A referência de formatação é
[Backend/src/shared/middleware/errorHandler.ts](Backend/src/shared/middleware/errorHandler.ts).
Aplique o mesmo estilo em todo o código novo (backend e frontend):

1. **Chaves no estilo Allman** — a chave de abertura de `if`/`else`/`try`/`catch`/`finally`,
   funções e métodos fica em **linha própria**, alinhada à palavra-chave. Não use a forma K&R
   (`if (x) {`) nem condições de uma linha sem chaves (`if (x) return;`).
2. **Espaço dentro de parênteses e colchetes** — `funcao ( arg )`, `if ( condicao )`,
   `vetor[ indice ]`, `objeto[ chave ]`.
3. **Espaço dentro de chaves de objetos** — `{ campo: valor }`, e listas/objetos com vários
   itens podem ser quebrados em uma linha por item para melhor visualização.
4. Alinhe blocos relacionados de atribuições/propriedades quando isso ajudar a leitura
   (ver o `CONSTRAINT_CAMPO` no `errorHandler`).

## Camada de dados — postgres.js + node-pg-migrate + kanel

Sem ORM. A configuração da conexão e das ferramentas:
- **Conexão:** `DATABASE_URL` no `.env` (lido com `dotenv`). O cliente único `sql` vive em
  `Backend/src/lib/db.ts` (`postgres(process.env.DATABASE_URL, { ...opções })`), com pool
  enxuto, `idle_timeout`, `connect_timeout` e `statement_timeout` (apoia RNF02 ≤ 2s). O
  `server.ts` chama `sql.end()` no `SIGTERM`/`SIGINT` (shutdown gracioso).
- **Schema/migrations:** SQL versionado em `Backend/src/db/migrations/` via **node-pg-migrate**
  (`up`/`down`). É a **fonte de verdade** do banco (não há mais `schema.prisma`). Identificadores
  são *PascalCase entre aspas* (`"Paises"`, `"codPais"`), então o SQL precisa citá-los; o
  `dtEdicao` tem `DEFAULT CURRENT_TIMESTAMP` (não há mais `@updatedAt`).
- **Tipos:** **kanel** introspecta o banco e gera as interfaces TS das tabelas em
  `Backend/src/db/types/` — rode `npm run types:gen` após cada migration.
- **Transações:** `withTransaction(fn)` (`src/shared/transaction/withTransaction.ts`) envolve
  `sql.begin`; use-o em operações multi-tabela (compras, NF-e, contas) — RNF06.
- **Erros do Postgres:** o `errorHandler` mapeia códigos (`23505` unique, `23503` FK/RN002)
  para `AppError` com mensagem em português.
- **Banco local:** PostgreSQL 16 instalado via Homebrew, iniciado com
  `brew services start postgresql@16`. O banco `si_joao_bail_2026` já foi criado.

## Comandos

```bash
# Backend (em /Backend)
npm run dev            # sobe a API com tsx watch (hot-reload)
npm run build          # compila TypeScript → dist/
npm run typecheck      # npx tsc --noEmit (sem emitir arquivos)
npm test               # Vitest (run único)
npm run test:watch     # Vitest em modo watch
npm run lint           # ESLint em src/
npm run format         # Prettier em src/
npm run migrate:up     # node-pg-migrate up (aplica migrations SQL)
npm run migrate:down   # node-pg-migrate down (reverte a última migration)
npm run migrate:drop   # node-pg-migrate down 0 (reverte todas as migrations)
npm run migrate:create # cria uma nova migration SQL
npm run types:gen      # kanel — regenera os tipos das tabelas após migrations
npm run seed           # tsx src/db/seed.ts (idempotente)

# Frontend (em /Frontend — EP-11, ainda não inicializado)
npm run dev            # Vite dev server
npm test               # Vitest
```

## Relatório LaTeX (`docs/relatorio/`)

O relatório acadêmico do sistema é escrito em LaTeX e compilado com **latexmk**
(config em `docs/relatorio/latexmkrc`, saída em `docs/relatorio/build/`).

> **`docs/relatorio/` e `docs/ref/` são inteiramente locais — fora do controle de versão.**
> O `.gitignore` ignora as duas pastas por completo (`docs/ref`, `docs/relatorio`): nada
> dentro delas (fontes `.tex`/`.puml`/`.mmd`, PNGs em `img/`, nem o `main.pdf` compilado)
> vai para commit. A entrega do relatório acadêmico é feita por fora deste repositório
> (ex.: anexo separado na entrega do trabalho), não via git. Ver
> [Ao concluir uma tarefa](#ao-concluir-uma-tarefa) — tarefas de código (Backend/Frontend)
> não são afetadas por essa regra.

### Estrutura

```
docs/relatorio/
  main.tex                    → documento raiz; encadeia as seções via \input{sections/NN-...}
  sections/                   → uma seção por arquivo (01-introducao, 03-der-diagrama-classes,
                                 07-diagramas-sequencia, ...); a ordem no PDF é dada pela ordem
                                 dos \input em main.tex, não pelo número no nome do arquivo
  diagramas/
    casos-uso/*.puml          → fontes PlantUML dos diagramas de caso de uso (um por módulo)
    sequencia/*.mmd           → fontes Mermaid (sequenceDiagram) dos diagramas de sequência
    classes/NN-dominio.mmd    → fontes Mermaid (classDiagram) do diagrama de classes/DER,
                                 particionadas por subdomínio (localizacao, parceiros-negocio,
                                 produtos-catalogo, logistica-veiculos, financeiro, compras,
                                 fiscal, acesso-usuarios, recursos-humanos, catalogo-extensoes,
                                 atendimento-os, vendas); cada arquivo traz as classes do próprio
                                 subdomínio e, quando há relacionamento cruzado, uma classe-stub
                                 (só o nome, sem atributos) da entidade externa referenciada,
                                 indicando entre parênteses o subdomínio de origem
  diagrama-classes-kaneko.mmd → fonte Mermaid (classDiagram) do diagrama de classes/DER
                                 completo (todos os subdomínios num arquivo só); mantida como
                                 referência única do modelo completo, mas não é renderizada
                                 diretamente no relatório — as partições em diagramas/classes/
                                 são a fonte usada nas figuras (ver princípio abaixo). Ao alterar
                                 entidades/relacionamentos, atualize os dois: o arquivo completo
                                 e a(s) partição(ões) correspondente(s)
  img/                        → PNGs já renderizados, referenciados via \includegraphics
                                 (uc-*.png ← .puml de casos-uso; seq-*.png ← .mmd de sequência;
                                 diagrama-classes-<dominio>.png ← diagramas/classes/*.mmd;
                                 proto-*.png ← protótipos de tela, sem fonte de diagrama)
  modelo/                     → PDFs de referência/gabarito fornecidos para o trabalho (não fazem
                                 parte do relatório final, não são gerados nem editados por nós)
  build/                      → saída do latexmk (nada aqui vai para o commit — ver
                                 "docs/relatorio/ e docs/ref/ são inteiramente locais" acima)
  scripts/
    gerarDiagramaMermaid.ts   → gera diagrama-classes-kaneko.mmd (fonte única ENTIDADES/
                                 RELACIONAMENTOS) e docs/13-diagrama-mermaid.md; script TS sem
                                 dependências além do Node (`node:fs`, `node:path`, `node:url`),
                                 roda isolado do Backend — ver comando abaixo
```

### Ferramentas de diagrama

- **PlantUML** — diagramas de caso de uso (`diagramas/casos-uso/*.puml`, sintaxe
  `@startuml ... actor / rectangle / usecase ... @enduml`). Renderize num editor/CLI PlantUML
  e salve o PNG em `img/uc-<modulo>.png`.
- **Mermaid** — diagrama de classes/DER (`classDiagram`) e diagramas de sequência
  (`sequenceDiagram`). Duas formas de renderizar:
  - **Mermaid Live Editor** (colar o `.mmd`, exportar PNG) — sem dependências locais.
  - **mermaid-cli**, sem instalar globalmente:
    `npx -y @mermaid-js/mermaid-cli -i diagramas/sequencia/<nome>.mmd -o img/seq-<nome>.png -s 3 -b white`
    (rodar a partir de `docs/relatorio/`; `-s 3` dá resolução alta, `-b white` evita fundo
    transparente no PDF). Evite `<br/>` dentro de `Note` em `sequenceDiagram` — o parser do
    mermaid-cli quebra nisso; use texto corrido.
- Não existe passo de build automático que renderize `.puml`/`.mmd` para PNG — o PNG é gerado
  manualmente e fica junto da fonte em `img/` (ambos locais, não versionados — ver acima).
- **`scripts/gerarDiagramaMermaid.ts`** — gera o diagrama de classes Mermaid (fonte única
  `ENTIDADES`/`RELACIONAMENTOS`) a partir do schema/roadmap, escrevendo
  `img/diagrama-mermaid.mmd` e `docs/13-diagrama-mermaid.md`. Vive em `docs/relatorio/` (não em
  `Backend/`) porque só serve ao relatório; não importa nada do Backend, então roda isolado via
  `npx`, sem precisar de `npm install` nem do `node_modules` do Backend:
  `cd docs/relatorio && npx -y tsx scripts/gerarDiagramaMermaid.ts`. Ao mudar schema/módulos
  implementados ou o roadmap, atualize as constantes `ENTIDADES`/`RELACIONAMENTOS` no script e
  rode-o de novo antes de re-renderizar as partições em `diagramas/classes/*.mmd`.
- Diagramas de classe/DER com muitas entidades (30+) não cabem legíveis num único diagrama
  Mermaid com layout automático — por isso o diagrama de classes é particionado por subdomínio em
  `diagramas/classes/*.mmd` (ver estrutura acima), em vez de forçar tudo numa imagem só. Ao
  renderizar cada partição, para subdomínios com poucas classes e muitos atributos (diagrama
  cresce mais em altura que em largura) adicione `direction LR` logo após `classDiagram` no
  `.mmd` — deixa o layout mais largo que alto e evita estourar a altura da página no LaTeX.

### Referências usadas para redigir o relatório

- **`docs/relatorio/modelo/`** — dois PDFs-gabarito (`documentação-do-sistema.pdf`,
  `modelo documentação pratica.pdf`) que servem de referência de estrutura/formato exigidos
  pela disciplina/avaliador. São só consulta — nunca editados nem gerados por nós.
- **`docs/` (raiz do projeto)** — fonte de verdade sobre o domínio, arquitetura e regras de
  negócio (ver seção "Fonte de verdade: leia `docs/` primeiro" acima); qualquer conteúdo do
  relatório sobre entidades/fluxos/regras deve ser consistente com esses arquivos.
- **`Backend/src/`** — para diagramas de sequência, a fonte da verdade são os arquivos reais
  de cada módulo (`*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`,
  `*.schema.ts`) e o código transversal em `shared/` (`validate.ts`, `errorHandler.ts`,
  `withTransaction.ts`). Diagramas devem retratar o **estado final pretendido** da
  arquitetura (ex.: autenticação JWT/sessão real), não andaimes temporários de teste/dev
  (ex.: o stub atual do `AuthMiddleware` que fixa `codUser = 1`).

### O que sobe no commit

- **Nada.** `docs/relatorio/` e `docs/ref/` são ignorados por completo no `.gitignore`
  (`docs/ref`, `docs/relatorio`) — fontes (`.tex`, `.puml`, `.mmd`), PNGs em `img/`, o
  `main.pdf` compilado e o `scripts/gerarDiagramaMermaid.ts` são todos locais, nunca
  versionados. Não crie exceções (`!padrão`) para liberar arquivos específicos dessas pastas
  sem antes confirmar com o usuário — a regra é ignorar as pastas inteiras.
- Gere o PDF normalmente para conferir o resultado (`cd docs/relatorio && latexmk`), mas isso
  é só para a entrega por fora do repositório — não afeta o que vai para o git.

## Ao concluir uma tarefa

- Confirme que todos os testes passam (`npm test` em `/Backend`).
- Rode o type-check (`npm run typecheck`).
- Se mudou entidades, esquema ou regras, **atualize os `docs/` correspondentes**.
- Não commite nem faça push sem o usuário pedir.

## Commits e descrições de MR

- Mensagens de commit e descrições de MR/PR devem ser sempre em **português (pt_BR)**.
- Siga o padrão Conventional Commits em português: `tipo(escopo): descrição` — ex.: `feat(localização): adicionar CRUD de Países`.
