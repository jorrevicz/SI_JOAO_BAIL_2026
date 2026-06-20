---
name: generate-mr-description
description: Gera descrição completa de MR/PR em Markdown com base em commits ou alterações da sessão. Use quando o usuário pedir para gerar descrição de MR, descrever alterações, criar descrição de pull request, ou invocar /generate-mr-description. Detecta automaticamente se é feature ou bugfix e criar uma descrição completa.
allowed-tools:
  - Bash(git:*)
  - Bash(grep:*)
  - Bash(find:*)
  - Read
language: pt_BR
---

# Skill: Geração de Descrição de MR

Gera descrição completa de MR/PR em Markdown, pronta para copiar, com base em commits especificados ou alterações da sessão atual.

## Fontes de dados (prioridade)

1. **Commits explícitos** — se o usuário mencionar commits específicos (ex: "últimos 3 commits", "último commit", hash específico)
2. **Sessão atual** — se o usuário não mencionar commits mas houver histórico de alterações na conversa
3. **Padrão** — último commit do repositório

## Processo de execução

### Passo 1 — Identificar o escopo dos commits

Analise o pedido do usuário:

- "últimos N commits" → `git log --oneline -N`
- "último commit" → `git log --oneline -1`
- hash específico → `git show <hash>`
- sem menção + sem histórico de sessão → `git log --oneline -1` (padrão)

Execute `git log --oneline -10` para ter contexto dos commits recentes.

### Passo 2 — Coletar detalhes dos commits

Para cada commit no escopo:

```bash
git show <hash> --stat --no-patch   # arquivos alterados
git show <hash> --no-stat           # diff completo
git log <hash> -1 --format="%s%n%b" # mensagem completa
```

Também execute:
```bash
git diff <hash_mais_antigo>^...<hash_mais_recente> --name-only
```

### Passo 3 — Identificar o contexto (subdomínio do sistema)

**3a. Verificar se o contexto foi mencionado na sessão** — se o usuário mencionou um épico ou módulo na conversa, use esse contexto.

**3b. Mapear pelos caminhos dos arquivos alterados** — use a tabela abaixo para identificar o subdomínio a partir do path dos arquivos:

| Padrão nos caminhos | Contexto |
|---|---|
| `paises`, `estados`, `cidades`, `localizacao` | `LOCALIZAÇÃO` |
| `fornecedores`, `clientes`, `transportadoras`, `parceiros` | `PARCEIROS` |
| `produtos`, `categorias`, `ncm` | `PRODUTOS` |
| `veiculos`, `logistica` | `LOGÍSTICA` |
| `financeiro`, `contas`, `parcelas`, `pagamento`, `condicao` | `FINANCEIRO` |
| `compras`, `compra-produto` | `COMPRAS` |
| `fiscal`, `nfe`, `notas-fiscais` | `FISCAL` |
| `users`, `auth`, `acesso`, `login` | `ACESSO` |
| `migrations`, `seed`, `db`, `types` (kanel) | `BANCO DE DADOS` |
| `app.ts`, `server.ts`, `shared`, `lib`, `middleware` | `FUNDAÇÃO` |
| `Frontend/` | `FRONTEND` |

**3c. Verificar docs/ para contexto adicional** — se necessário, consulte os documentos relevantes:

```bash
# Identificar o épico pelo módulo
grep -r "<módulo>" docs/11-backlog.md
```

Se múltiplos subdomínios estiverem presentes, escolha o mais relevante ou combine (ex: `LOCALIZAÇÃO + PARCEIROS`).

### Passo 4 — Determinar o tipo: Feature ou Bugfix

Analise o conjunto de commits e arquivos para determinar:

**É BUGFIX se:**
- Mensagens de commit contêm: `fix`, `bug`, `corrige`, `correção`, `bugfix`, `hotfix`, `resolve`, `erro`
- Branch contém: `bugfix`, `hotfix`, `fix`
- As alterações corrigem comportamento existente sem adicionar nova funcionalidade

**É FEATURE se:**
- Mensagens de commit contêm: `feat`, `feature`, `add`, `adiciona`, `implementa`, `novo`, `cria`
- Branch contém: `feature`, `feat`, `ep-`, `ep`
- As alterações adicionam nova funcionalidade

**Em caso de dúvida:** prefira FEATURE.

### Passo 5 — Analisar as alterações em profundidade

Com base nos diffs coletados, identifique:

- **O que foi implementado/corrigido** (objetivo principal)
- **Épico e tasks do backlog** relacionados (ex: EP-04 → T-040 a T-042), se identificável pelos arquivos
- **Camadas afetadas:** migration SQL, seed, repository, service, controller, routes, frontend
- **Padrões do projeto aplicados:** TDD (Red→Green→Refactor), soft delete, auditoria (`codUser`/`dtCriacao`/`dtEdicao`/`isActive`), transação atômica (`withTransaction`), paginação por cursor
- **Como testar** (fluxo do usuário ou chamadas de API para validar)
- **Considerações técnicas** (decisões relevantes, limitações, regras de negócio aplicadas)

### Passo 6 — Gerar o título

Formato obrigatório: `[CONTEXTO] - Título descritivo`

- `CONTEXTO` = subdomínio identificado no Passo 3 (em maiúsculas)
- Título = descrição concisa do que foi feito (máximo 60 caracteres)

Exemplos:
- `[LOCALIZAÇÃO] - CRUD de Países, Estados e Cidades`
- `[FINANCEIRO] - Contas a Pagar com cancelamento`
- `[FUNDAÇÃO] - Arquitetura base do backend (EP-03)`
- `[COMPRAS] - Correção na atomicidade da transação`

### Passo 7 — Gerar a descrição em Markdown

**NÃO crie arquivo.** Exiba o Markdown diretamente na resposta, dentro de um bloco de código, para o usuário poder selecionar e copiar.

---

## Formato de saída final

Sempre exiba nesta ordem:

1. **Título do MR** (em destaque, fora do bloco de código):
   ```
   **Título:** [CONTEXTO] - Descrição do título
   ```

2. **Descrição em bloco de código Markdown** (para copiar):
   ````
   ```markdown
   [conteúdo da descrição completa]
   ```
   ````

---

## Template da descrição (use como base, adaptando ao conteúdo real)

```markdown
## O que foi feito

<resumo em 2–3 frases do que foi implementado ou corrigido, com referência ao módulo/épico>

## Itens implementados

- <item 1 — seja específico: ex. "Repository `PaisesRepository` com `findAll` paginado por cursor">
- <item 2>
- <item 3>

## Camadas afetadas

- [ ] Migration SQL / seed
- [ ] Repository (acesso a dados postgres.js)
- [ ] Service (regra de negócio)
- [ ] Controller + Routes (HTTP)
- [ ] Testes Vitest
- [ ] Frontend (React/SPA)

## Como testar

1. <passo 1 — ex. "Subir a API: `npm run dev` em `/Backend`">
2. <passo 2 — ex. "Executar `GET /api/paises` e verificar lista paginada">
3. <passo 3 — ex. "Tentar excluir um País vinculado a Estados e confirmar erro em português">

## Observações técnicas

> <decisões de design, regras de negócio aplicadas (RN001/RN002/RNF06…), limitações ou pontos de atenção>

## Checklist

- [ ] Testes passando (`npm test` em `/Backend`)
- [ ] Type-check limpo (`npm run typecheck`)
- [ ] Lint/format sem erros (`npm run lint`)
- [ ] Soft delete e auditoria respeitados (`isActive`, `codUser`, `dtCriacao`/`dtEdicao`)
- [ ] `docs/` atualizados se houve mudança de entidade, esquema ou regra
```

---

## Notas importantes

- **Nunca crie arquivos** — a descrição é exibida apenas no chat
- **Preencha com conteúdo real** — não deixe placeholders como `<item 1>`; use o conteúdo real dos commits
- **Não mencione commits** — não mencione hashes ou títulos de commits, nem nomes de arquivos
- **Português** — toda a descrição e título em português
- **Checklist sempre fixo** — os itens do checklist nunca mudam; apenas os checkboxes podem ser marcados se o contexto da sessão indicar que já foram cumpridos
- **Seja específico** nos passos de teste: mencione rotas, entidades e fluxos reais com base no que foi implementado
- **Épicos e tasks** — mencione o épico/task relevante (ex: EP-04, T-040) quando identificável, mas apenas se tiver certeza
