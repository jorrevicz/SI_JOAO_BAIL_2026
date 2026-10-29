# 09 — Roadmap de Implementação

Ordem prática de construção, derivada das **prioridades de projeto**. Os módulos
referem-se ao [Modelo de Domínio](05-modelo-de-dominio.md) e os requisitos ao
[documento de Requisitos](04-requisitos.md).

## Princípios de entrega

1. **Backend-first por módulo** — concluir e testar o backend de cada módulo antes
   de construir o frontend correspondente; o frontend avança em paralelo, módulo a
   módulo, não ao final de todo o backend.
2. **CRUDs em lotes de três** ("revezamento três em três") — começando pelos mais
   básicos, para agilizar e evitar complexidade.
3. **Consultas (Read) primeiro**, depois as demais operações (Create/Update/Delete)
   de cada módulo.
4. **Criar o banco**, depois **scripts de seed**, depois **integrar** o backend às
   consultas.
5. **Login e venda** completos: decisão e detalhamento **adiados**. **Compras** tem
   prioridade sobre as Ordens de Serviço (ver [Fase 4](#fase-4--compras-e-nf-e--prioridade-sobre-a-fase-os)).
6. **TDD obrigatório para services:** ao criar ou modificar qualquer *service* de
   backend, aplicar o ciclo Red → Green → Refactor antes de avançar para o próximo
   método. Detalhes em [CLAUDE.md](../CLAUDE.md#princípios-obrigatórios).

## Fase 0 — Fundação ✓ concluída (EP-00 a EP-03)

- [x] Estrutura de diretórios (`/Backend/src/db`, `/Backend/src`, `/Frontend/src`) —
      ver [Arquitetura](02-arquitetura.md#estrutura-de-diretórios-raiz-do-projeto).
- [x] Configurar acesso ao **PostgreSQL local** ([Stack](03-stack-tecnologica.md)).
- [x] Modelar o schema do banco em formas normais
      ([Modelo de Dados](06-modelo-de-dados.md)).
- [x] Scripts de **seed** para os cadastros básicos.
- [x] Padronizar nomes (corrigir grafias do diagrama — ver
      [nota de grafia](05-modelo-de-dominio.md#convenções-de-atributos-comuns)).
- [x] Arquitetura base do backend: camadas, erros, transação, auth stub, validação Zod.

> **EP-13 concluído:** a camada de dados migrou de Prisma para **postgres.js +
> node-pg-migrate + kanel** (sem ORM). Detalhes em
> [EP-13 do Backlog](11-backlog.md#ep-13--transição-da-camada-de-dados-prisma--postgresjs).

## Fase 1 — Cadastros básicos (lote de 3) ✓ concluída

Pré-requisito de todo o resto (geografia). Implementadas **consultas primeiro**, depois C/U/D.

1. [x] **Países** (RF01) — backend + telas.
2. [x] **Estados** (RF02) — backend + telas.
3. [x] **Cidades** (RF03) — backend + telas.

> **Backend (EP-04) concluído:** CRUDs em 4 camadas
> (`schema → controller → service → repository → routes`) com testes de service, repository
> (rollback) e rota (`supertest`). Inclui a migration de índices únicos `Paises(ddi)` e
> `Estados(codPais, uf)` — ver [EP-04 do Backlog](11-backlog.md#ep-04--cadastros-geográficos-lote-1).
> **Frontend concluído:** bootstrap do SPA (EP-11 — Vite + React + TS + styled-components +
> React Router + camada axios) e telas de Países, Estados e Cidades (TanStack Table, navegação
> hierárquica por query params, formulários em modal).
>
> **Validação de formulários (backend-driven):** o Backend é a única fonte de verdade de
> validação; a resposta 400 devolve `erros: { campo: mensagem }` e o Frontend mapeia por campo,
> sem duplicar schema nem adicionar Zod — ver
> [decisão de validação](ref/validacao-frontend-backend-driven.md).
>
> **▶ Próximo passo:** Fase 2 — Catálogo e parceiros (EP-05: Categorias, Produtos).

## Fase 2 — Catálogo e parceiros (lotes de 3)

- [x] Lote 2A: **Categorias**, **Produtos** (RF09) — CRUDs backend + telas frontend.
- [x] Lote 2B: **Fornecedores** (RF07), **Clientes** (RF08), **Transportadoras** (RF10), **Veículos** (RF04).

> **Lote 2A concluído:** backend em 4 camadas com testes TDD (service unitário, repository
> em rollback, routes supertest) e frontend com navegação hierárquica Categorias → Produtos
> por query params, formulário em modal com seleção de categoria.
>
> **Lote 2B concluído:** backend (Veículos, Fornecedores, Clientes, Transportadoras) em 4
> camadas com testes TDD; soft delete e HasDependents para cada entidade; frontend com
> telas de listagem e formulário modal, selects de Cidades/Estados/Veículos carregados via
> API; menu lateral atualizado.
>
> **▶ Próximo passo:** Fase 3 — Condições de Pagamento, Formas de Pagamento, Parcelas.

## Fase 3 — Financeiro (lote de 3) ✓ concluída

- [x] **Condições de Pagamento** (RF05), **Formas de Pagamento**, **Parcelas** (RF06).

> **Backend concluído:** CRUDs em 4 camadas com testes TDD (service unitário, repository
> rollback, routes supertest); soft delete e HasDependents para cada entidade; hierarquia
> CondicaoDePagamento → Parcelas (com validação de CondicaoPagamento e FormaDePagamento no service).
>
> **Frontend concluído:** telas de Condições de Pagamento (com botão "Parcelas" para navegação
> hierárquica), Formas de Pagamento e Parcelas (filtradas por condição via query param
> `codCondDePag`, breadcrumb e select de FormasDePagamento no formulário); menu lateral com
> seção Financeiro. Seed atualizado com 3 condições, 4 formas e 6 parcelas.
>
> **▶ Próximo passo:** Fase 3B — Contas a Pagar (RF11) e Contas a Receber (RF12).

## Fase 3B — Contas a Pagar e Contas a Receber ✓ concluída

- [x] **Contas a Pagar** (RF11) — referencia Fornecedores, FormaDePagamento; chave natural
      (`numero`, `modelo`, `serie`, `codFornecedor`, `parcela`); `registrarBaixa`/`cancelar` dedicados.
- [x] **Contas a Receber** (RF12) — referencia Clientes, FormaDePagamento; chave natural
      (`numero`, `modelo`, `serie`, `codCliente`, `parcela`) e `registrarBaixa`/`cancelar`.

> **Backend concluído:** CRUDs em 4 camadas com testes TDD para as duas entidades (service
> unitário, repository rollback, routes supertest); `RegistrarBaixa`/`Cancelar` como operações
> dedicadas (não passam pelo `Update`); RN de bloqueio (não baixar conta cancelada, não
> cancelar conta já baixada).
>
> **Frontend concluído (T-115A):** telas de Contas a Pagar e Contas a Receber, com modais
> dedicados de baixa e de cancelamento.
>
> **▶ Próximo passo:** Fase 4 (Compras). A Fase OS é retomada só após as fases de compras.

## Fase 4 — Compras e NF-e ⭐ prioridade sobre a Fase OS

Por decisão do responsável pelo projeto, o processo de **Compras** passa a ter
prioridade sobre as Ordens de Serviço: é implementado logo após a Fase 3B (e a
conclusão do frontend de Contas a Pagar/Receber) e **antes de retomar a Fase OS**, que
só é terminada depois das fases de compras (Compras e NF-e).

- **Compras** (RF13) — operação atômica
  ([RNF06](04-requisitos.md#requisitos-não-funcionais)).
- **Nota Fiscal Eletrônica** (RF14, RNF10) — depende de compras e do módulo fiscal.

Regras em [Gerenciar Compras](07-casos-de-uso.md#gerenciar-compras) (RN004–RN018) e
entidades em [Modelo de Domínio § Compras](05-modelo-de-dominio.md#6-compras). A fase é
dividida em lotes, backend-first e consultas primeiro, com TDD em todo *service*:

| Lote | Conteúdo | Backlog |
|------|----------|---------|
| **C-0** ✓ | Correção de Produtos: `custoProd` (custo inicial com coluna própria), `precoVenda` (editável), remoção de `saldoProd` — backend + frontend | T-079 |
| **C-1** ✓ | Migration de Compras/CompraProduto, seed, consultas `GET` de compras e de classificações | T-080 |
| **C-2** ✓ | Cadastro da compra: validar documento (RN007), criar com itens embutidos, rateio e totais calculados no service (a edição e a exclusão foram removidas junto com o estado "aberto") | T-081a |
| **C-3** ✓ | Lançamento transacional no próprio cadastro (estoque + custo médio ponderado) e `cancelarCompra()` com estorno | T-081b, T-082 |
| **C-4** ✓ | Frontend de Compras: listagem, formulário, lançar (substitui o salvar) e cancelar | T-115B (compras) |
| **C-5** ✓ | NF-e de entrada: `gerarNotaFiscal` a partir da compra (RN002/RN003), consultas e cancelamento — backend + frontend | T-083, T-090–T-092, T-115B |

**Ciclo da compra (RN013):** sem rascunho — a compra nasce `lançada` e só pode ser cancelada
(sem coluna `situacao`). O cadastro/lançamento, numa única transação, grava a compra e soma a quantidade ao
`estoque`, recalcula `custoMedioProd` (média ponderada; se ainda for 0, parte de
`custoProd`), grava `custoProd` com o custo unitário da compra e preenche `dtEntrada`
(RN018). **Não gera Contas a Pagar** — elas continuam lançadas manualmente. Cancelar uma
compra lançada estorna estoque e custo médio e exclui (soft delete), na mesma transação, as
contas a pagar do mesmo documento — único caminho de exclusão de conta a pagar (sem
`PATCH /api/contas-pagamento/.../cancelar` nem botão na tela); "cancelada" é derivada de
`justificativaCancelamento` (sem terceiro estado, RN005 transversal). A reautenticação do
cancelamento (RN014) é, até o EP-10, só um popup no Frontend.

**Cálculo — feito só no Backend, em TypeScript (`compras.calculo.ts`), nunca no SQL nem no
Frontend.** O formulário pede a prévia a `POST /api/compras/calculo` a cada mudança de item
ou despesa e apenas exibe o resultado; o repository só lê o produto com trava de linha
(`FOR UPDATE`) e grava os valores já calculados:

- `líquido do item = ( valorUnitario − desconto ) × quantidade` (desconto só por item, RN016);
- `total dos produtos = Σ líquidos` (RN012);
- rateio de `frete + seguro + despesas` entre os itens (RN011):
  `valorRateio = ( líquido ÷ total dos produtos ) × ( frete + seguro + despesas )` e
  `percentualRateio = líquido ÷ total dos produtos × 100`, este apenas arredondado em 2 casas
  (a soma pode diferir de 100%); o `valorRateio` tem os centavos residuais distribuídos pelos
  maiores restos, para que a soma feche no total das despesas;
- `custoMedioProduto` do item = `( líquido + valorRateio ) ÷ quantidade`, com 6 casas decimais;
- `vlrTotal = total dos produtos + frete + seguro + despesas` — os encargos da
  condição de pagamento não entram (aplicam-se a títulos em atraso);
- lançamento: `novoCustoMédio = ( saldo × custo + qtd × custoUnitário ) ÷ ( saldo + qtd )`,
  com `saldo = estoque` antes da entrada e `custo = custoMedioProd` (ou `custoProd` enquanto o médio for 0); estorno faz a conta
  inversa e zera o custo médio quando o estoque zera.

> **Lotes C-0 e C-1 concluídos:** Produtos corrigido (migration `produtos-custo-preco-venda`)
> e schema de Compras pronto para as regras (migration `compras-itens-situacao`); módulos
> `compras` (`GET /api/compras`, `/validar`, `/:numero/:modelo/:serie/:codForn` com itens)
> com testes TDD; seed com uma compra (hoje já lançada).
>
> **Lotes C-2, C-3 e C-4 concluídos:** `POST /api/compras` (já lança: estoque + custo médio
> na mesma transação — RN013/RN018) e `PATCH .../cancelar` (com estorno — RN014); `PUT`,
> `DELETE` e `PATCH .../lancar` foram removidos com o estado "aberto" (migration
> `compras-sem-estado-aberto`), além de `POST /api/compras/calculo` (prévia); testes TDD (cálculo puro, service,
> repository rollback, routes supertest com o ciclo completo). Frontend: página **Compras**
> (ações Consultar/Cancelar; o botão **Lançar compra** do formulário substitui o salvar),
> formulário na ordem das RNs (documento validado → fornecedor/transportadora/classificação/
> datas → frete, seguro e outras despesas → tabela de produtos com rateio e totais →
> condição herdada do fornecedor → subtotais e total → saldo e preço de venda), consultas
> de Produto e Transportadora (padrão `ClienteConsulta`, com cadastro embutido) e popup de senha
> (`ConfirmarSenhaModal`, só visual até o EP-10).
>
> **Lote C-4B concluído (RN019–RN023 + RNF14):** bloqueio do documento fiscal após o
> primeiro produto (RN019), unidade do produto definida por item (RN020 — migration
> `compras-unidade-e-parcelas`, coluna `CompraProduto.unidade`), bloqueio de documento e
> produtos com parcelas geradas, voltando só ao descartá-las com confirmação (RN021),
> geração automática das parcelas pela condição (RN022 — `POST /api/compras/parcelas`,
> `CalcularParcelasCompra` no Backend) e parcelas ajustáveis só na compra (RN023 — nova
> tabela `CompraParcelas`, reconciliada por `numParcela`; soma = `vlrTotal`). Datas no
> Frontend passaram a `dd/mm/aa` (RNF14). Ver
> [Gerenciar Compras](07-casos-de-uso.md#gerenciar-compras).
>
> **Lote C-5 concluído (NF-e de entrada):** migrations `nfe-entrada-da-compra` e
> `nfe-chave-da-compra` dão à NF-e **as mesmas chaves da compra** como chave primária
> (`modelo`, `numero`, `serie`, `codFornecedor` — uma nota por compra, inclusive cancelada;
> `ProdutoNfe`/`VeiculoNfe` herdam a chave composta) e normalizam `NotasFiscaisEletronicas`/
> `ProdutoNfe` (sem campos de item no cabeçalho nem valores calculados). Módulo
> `notas-fiscais`: consultas, prévia (`POST /calculo`), geração transacional com os itens
> da compra e a tributação informada (CFOP, CSOSN, alíquotas de ICMS/IPI), e cancelamento.
> Base, ICMS, IPI e totais são calculados no Backend (`notasFiscais.calculo.ts`). Compra
> com nota ativa não pode ser cancelada. Frontend: ações **Gerar NF-e**/**Consultar NF-e**
> na listagem de Compras e página **Notas Fiscais**. Ficam pendentes do EP-09 os fluxos por
> ator e o vínculo de veículo (T-093) e a emissão junto à SEFAZ (T-094, fora do MVP).
>
> **▶ Próximo passo:** retomar a Fase OS (telas de Cargos/Funcionários/Serviços/Peças e UI de
> aprovação de orçamento de peças) — ou T-093/T-094, a confirmar com o responsável.

## Fase OS — Ordem de Serviço ⭐ módulo central da Kaneko Informática

A **Ordem de Serviço** é o coração operacional da Kaneko Informática. Os Lotes OS-A
(concluído) e OS-B (backend concluído) já foram entregues, mas, por decisão do
responsável pelo projeto, o restante da fase (frontend do Lote OS-B e Lote OS-C) é
**retomado e terminado somente após a Fase 4 — Compras e NF-e**, que tem prioridade.

Ciclo de vida de uma OS:

```
Abertura → Diagnóstico → Execução (serviços + peças) → Aprovação do cliente
         → Encerramento (cobrança) → Entrega do equipamento
```

Entidades e operações detalhadas em
[Modelo de Domínio § Atendimento (Ordem de Serviço)](05-modelo-de-dominio.md#8-atendimento-ordem-de-serviço)
(`OrdemDeServico`, `Aparelhos`, `Equipamentos`, `Procedimentos`, `ProcedimentosOdS` no
Lote OS-A; `Cargos`, `Funcionarios`, `Servicos`, `Pecas`, `ServicosOdS`,
`OrcamentoPecasOdS`, `SubstituirPecasOdS` no Lote OS-B — backend concluído, frontend
ainda pendente).

> O esquema abaixo reflete a migration `add-ordem-de-servico-tables` (já aplicada ao
> banco antes desta revisão da documentação) — ver nota de revisão na seção 8 do
> [Modelo de Domínio](05-modelo-de-dominio.md#8-atendimento-ordem-de-serviço).

Campos principais (Lote OS-A):

- **Aparelho recebido:** tipo/nome, série (opcionais), modelo, voltagem, garantia —
  registro por unidade física, nasce com a OS.
- **Ficha técnica do equipamento:** SO, socket, RAM, placa-mãe, BIOS, armazenamento
  (SSD/HD, capacidade, uso), Office, grupo de usuários de rede — levantada para a
  máquina daquela OS, durante o diagnóstico (opcional; não é criada na abertura).
- **Cliente** responsável (referencia `Clientes`); **atendente** e **solicitante**
  (texto livre).
- **Defeito relatado**, **acessórios entregues**, **observações de balcão**, **tipo da
  OS** (`tipoOdS`).
- **Diagnóstico:** observação técnica (`obsTecnica`), histórico de manutenção,
  checklist de checagens padronizadas (`Procedimentos` × `ProcedimentosOdS`).
- **Chave:** `numOdS` — inteiro auto-incrementado pelo banco na
  abertura (`INTEGER GENERATED BY DEFAULT AS IDENTITY`, sem `codOS` substituto); não é informado nem validado
  quanto a formato (revisão posterior ao Lote OS-A — ver nota abaixo).

Campos ainda **fora do Lote OS-A** (chegam nos Lotes OS-B/OS-C, ver abaixo): status
(máquina de estados), valor total, condição de pagamento, prazo/garantia, execução de
serviços e peças, aprovação do cliente, encerramento e entrega.

Dependências (Lote OS-A):

```
Clientes → OrdemDeServico
Aparelhos → OrdemDeServico (nascem juntos em abrirOS())
Equipamentos → OrdemDeServico (ficha criada/atualizada em registrarDiagnosticoOS(); codEquipamento anulável)
Procedimentos → ProcedimentosOdS → OrdemDeServico (checklist do diagnóstico)
```

Seguindo o padrão de "revezamento três em três" (ver [Princípios de entrega](#princípios-de-entrega)),
a fase é dividida em **3 lotes por etapa do ciclo de vida**, cada um com tasks
de backend + frontend, consultas antes de escrita:

### Lote OS-A — Abertura e Diagnóstico ✓ concluído

1. [x] **Backend:** CRUD de Ordem de Serviço (abertura, consulta, diagnóstico) —
       migration de ajuste (`ProcedimentosOdS`) + schema Zod + service (TDD) +
       repository + controller + routes; inclui os cadastros de apoio necessários
       (`Procedimentos`, catálogo) e as entidades embutidas na abertura (`Aparelhos`,
       `Equipamentos`).
2. [x] **Frontend:** listagem com filtro por cliente.
3. [x] **Frontend:** formulário de abertura e de diagnóstico (modal).

> **Backend concluído:** `abrirOS()` cria o cabeçalho e, na mesma transação (RNF06),
> o registro de `Aparelhos` daquela unidade (a ficha de `Equipamentos` foi **movida para
> o diagnóstico** — ver nota ao fim deste bloco). Na abertura original do
> Lote OS-A, `numOdS` era uma chave natural (`CHAR(8)`) informada pelo requisitante e
> validada quanto à disponibilidade (`23505` → 409 PT) — **revisado posteriormente**:
> por decisão do responsável pelo projeto, `numOdS` passou a ser gerado pelo banco
> (inicialmente `UUID`, depois `INTEGER` auto-incrementado, igual às demais tabelas), sem campo de entrada nem validação de
> formato no schema Zod (nem no Frontend). `registrarDiagnosticoOS()` é operação
> dedicada que preenche `obsTecnica`/`historicoManutencao`/`dtAtendimento` e reconcilia
> a checklist de `ProcedimentosOdS` por diferença de conjuntos (mesmo padrão de
> Condição de Pagamento × Parcelas). Testes TDD (service unitário, repository
> rollback, routes supertest) para `Procedimentos` e `OrdemDeServico`.
>
> **Frontend concluído:** telas de **Procedimentos** (cadastro simples, mesmo padrão de
> Categorias) e **Ordens de Serviço** — listagem com filtro por cliente (picker
> `ClienteConsulta` reaproveitado), formulário de abertura (seleção de cliente libera
> a edição dos demais campos + campos de Aparelho embutidos, tudo num único
> `POST` — o número da OS não é mais digitado, nasce do `DEFAULT` do banco) e modal de
> diagnóstico dedicado (`PATCH .../diagnostico`) com checklist de `ProcedimentosOdS`
> embutido e reconciliado (mesmo padrão de Parcelas × Condição de Pagamento, via um
> `ProcedimentoOdSForm` que reaproveita um novo `ProcedimentoConsulta`).
>
> **Revisão posterior — Equipamento no diagnóstico:** a ficha de `Equipamentos` saiu da
> abertura e passou a ser registrada em `registrarDiagnosticoOS()` (opcional;
> `OrdemDeServicos.codEquipamento` anulável — migration `equipamento-no-diagnostico`);
> no Frontend, o bloco migrou do formulário de abertura para o `DiagnosticoModal`.
>
> **▶ Próximo passo:** Lote OS-B — Execução (serviços e peças) e Aprovação (após a Fase 4).

### Lote OS-B — Execução (serviços e peças) e Aprovação

1. [x] **Backend:** camada de aplicação para `Cargos`/`Funcionarios` (técnico
       responsável) e `Servicos`/`Pecas` (catálogos); linhas `ServicosOdS` e
       `OrcamentoPecasOdS`/`SubstituirPecasOdS` embutidas na OS.
2. [x] **Backend:** `situacao` (máquina de estados — migration
       `adicionar-situacao-ordem-de-servico`) e aprovação do cliente por item
       (`aprovado` em `OrcamentoPecasOdS`, via `aprovarOrcamentoPeca()`/
       `reprovarOrcamentoPeca()`).
3. [ ] **Frontend:** tela de detalhes com linha de serviços/peças e aprovação.

> **Backend concluído:** CRUDs em 4 camadas com testes TDD para `Cargos`, `Funcionarios`,
> `Servicos` e `Pecas` (mesmo padrão dos demais cadastros de apoio). `registrarExecucaoOS()`
> reconcilia `ServicosOdS`/`OrcamentoPecasOdS` por diferença de conjuntos (mesmo padrão de
> `ProcedimentosOdS`); `aprovarOrcamentoPeca()`/`reprovarOrcamentoPeca()` decidem por item
> (reprovar = soft delete da linha); `registrarSubstituicaoPecasOS()` é lançamento manual do
> técnico, só aceito para peça orçada e aprovada, reconciliado pela mesma filosofia de
> Parcelas × Condição de Pagamento. `situacao` progride automaticamente
> (`Aberta` → `Em execução` → `Aguardando aprovação` ⇄ `Em execução`); `tipoOdS` foi
> documentado como classificação livre da OS, não status — ver
> [Modelo de Domínio § Atendimento](05-modelo-de-dominio.md#8-atendimento-ordem-de-serviço).
>
> **▶ Próximo passo:** frontend do Lote OS-B (tela de execução/aprovação da OS) — após a
> Fase 4 (Compras e NF-e).

### Lote OS-C — Encerramento (cobrança) e Entrega

1. [ ] **Backend:** encerramento da OS — geração de `ContasAReceber` (depende de
       decisão sobre condição de pagamento na OS, ainda sem coluna no schema atual).
2. [ ] **Backend:** registro de entrega (`entreguePara`, `dtExecucao`) e cancelamento
       de OS.
3. [ ] **Frontend:** tela de encerramento/entrega e cobrança.

## Fase 5 — Acesso e fluxos adiados

- **Gerenciamento de Usuários** e **Login** (RF15) —
  ver [Segurança](08-seguranca-e-autenticacao.md).
- Fluxo completo de **venda** (a decidir). O fluxo de **compra** foi antecipado para a
  [Fase 4](#fase-4--compras-e-nf-e--prioridade-sobre-a-fase-os).

> **Frontend desta fase** (após backend pronto): telas de login e conta de usuário.

## Dependências entre módulos

```
Países → Estados → Cidades → { Fornecedores, Clientes, Transportadoras, Veículos }
Categorias → Produtos
Cond. Pagamento → Parcelas → { Contas a Pagar, Contas a Receber }
Fornecedores + Produtos + Cond. Pagamento + Transportadoras → Compras → NF-e
```

> Sempre cadastrar o "pai" antes do "filho" — daí Países/Estados/Cidades virem primeiro.

## Documentos relacionados

- [Requisitos](04-requisitos.md) — RFs entregues em cada fase.
- [Modelo de Domínio](05-modelo-de-dominio.md) — entidades de cada módulo.
- [Modelo de Dados](06-modelo-de-dados.md) — schema e seeds da Fase 0.
