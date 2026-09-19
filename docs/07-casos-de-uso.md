# 07 — Casos de Uso

Fonte: `documentação-do-sistema.pdf` (seção "Descrição de Casos de Uso"). Cada caso de
uso corresponde a um módulo do [Modelo de Domínio](05-modelo-de-dominio.md) e realiza
um ou mais [Requisitos Funcionais](04-requisitos.md#requisitos-funcionais).

## Regras de negócio transversais

Aplicam-se a praticamente todos os casos de uso:

- **RN001 — Autenticação:** somente usuários autenticados podem acessar os recursos
  (exceto login/registro). Ver [Segurança](08-seguranca-e-autenticacao.md) e
  [RNF03](04-requisitos.md#requisitos-não-funcionais).
- **RN002 — Exclusão protegida:** não se exclui um registro relacionado a outros
  (integridade referencial). Implementação em
  [Modelo de Dados](06-modelo-de-dados.md#integridade-referencial-e-exclusão).
- **RN003 — Reautenticação para cancelamento:** toda operação de **cancelamento**
  (`cancelarCompra()`, `cancelarContaPagar()`, `cancelarContaReceber()`,
  `cancelarNotaFiscal()`, cancelamento de parcela) exige que o usuário **reautentique**
  (informe a senha novamente) imediatamente antes de confirmar a ação, mesmo com sessão
  ativa. Detalhamento em
  [Segurança](08-seguranca-e-autenticacao.md#reautenticação-para-cancelamento-rn003).
- **RN004 — Edição protegida ([RNF13](04-requisitos.md#requisitos-não-funcionais)):**
  aplica-se a todo cadastro referenciado por FK de outra tabela (Países, Estados,
  Cidades, Categorias, Veículos, Condições de Pagamento, Formas de Pagamento, Clientes,
  Fornecedores, Produtos, Transportadoras). Duas camadas:
  - **Campos de valor/cálculo** (ex.: `estoque`/`custoMedioProd` de Produtos,
    `juroCondPag`/`multaCondPag`/`descontoCondPag` de Condição de Pagamento,
    `prazoCompensacao` de Forma de Pagamento) são **imutáveis desde o cadastro** — o
    backend omite esses campos do schema de update, **independente** de haver ou não
    dependente (RN004/RN007/RN008 específicas, já detalhadas nos módulos abaixo).
  - **Os demais campos** do registro só são editáveis enquanto **não houver dependente
    ativo** (`isActive = true`) referenciando-o em outra tabela; havendo, o `PUT` inteiro
    é rejeitado com `409` até o dependente ser desativado. Reaproveita a mesma checagem
    `HasDependents` usada na [exclusão protegida](#rn002---exclusão-protegida) (RN002),
    exceto quando o "dependente" é, na verdade, um **filho embutido** gerenciado de forma
    atômica dentro do próprio formulário do registro (ex.: Parcelas dentro de Condição de
    Pagamento) — nesse caso o filho embutido não conta como bloqueio, senão a própria
    edição do formulário pai (RN003–RN006 de Condição de Pagamento) ficaria impossível.

Pré-condição comum: **usuário previamente cadastrado** (respeitando RN001).
Ativação comum: **clicar no item de menu** correspondente.

## Catálogo de casos de uso

### Gerenciar Países
- **Ator:** Usuário · **RF:** RF01
- **RN002:** não excluir país relacionado a estados/cidades.
- **RN004 (transversal):** edição bloqueada enquanto houver estado ativo vinculado — ver
  [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar e remover países.

### Gerenciar Estados
- **Ator:** Usuário · **RF:** RF02
- **RN002:** não excluir estado relacionado a cidades, fornecedores, etc.
- **RN004 (transversal):** edição bloqueada enquanto houver cidade ou veículo ativo
  vinculado — ver [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar e remover estados.

### Gerenciar Cidades
- **Ator:** Usuário · **RF:** RF03
- **RN002:** não excluir cidade relacionada a clientes, fornecedores, transportadoras, etc.
- **RN004 (transversal):** edição bloqueada enquanto houver cliente, fornecedor ou
  transportadora ativo vinculado — ver [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar e remover cidades.

### Gerenciar Veículos
- **Ator:** Usuário · **RF:** RF04
- **RN002:** não excluir veículo relacionado a transportadoras ou notas fiscais.
- **RN004 (transversal):** edição bloqueada enquanto houver transportadora ativa ou nota
  fiscal vinculada — ver [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar e remover veículos.

### Gerenciar Condições de Pagamento
- **Ator:** Usuário · **RF:** RF05
- **RN002:** não excluir condição relacionada a parcelas ou compras.
- **RN003 — Parcela obrigatória:** toda condição deve ter ao menos uma parcela; condição sem parcelas é rejeitada (400).
- **RN004 — Ordenação de dias:** os `numDias` das parcelas devem ser estritamente crescentes (sem dias repetidos).
- **RN005 — À vista:** `numDias` mínimo é 1 (0 não permitido); parcela com 1 dia é exibida como "À vista".
- **RN006 — Percentual total:** a soma dos percentuais de todas as parcelas deve ser exatamente 100%; condição não pode ser salva se o total divergir.
- **RN007 — Custos imutáveis:** `juroCondPag`, `multaCondPag` e `descontoCondPag` são definidos no cadastro e **não podem ser alterados** na edição. O backend rejeita qualquer valor enviado no `PUT` (campos omitidos do schema de update).
- **RN004 (transversal):** os demais campos (`descricao`, `isActive`, lista de parcelas)
  ficam bloqueados para edição enquanto houver **cliente ou compra ativos** vinculados à
  condição — ver [regras transversais](#regras-de-negócio-transversais). Parcelas da
  própria condição **não** contam para esse bloqueio (são filho embutido, não dependente
  externo).
- **Pós-condição:** cadastrar, consultar, editar e remover condições de pagamento; parcelas gerenciadas de forma embutida e atômica junto à condição.

### Gerenciar Formas de Pagamento
- **Ator:** Usuário · **RF:** RF05 (complementar)
- **RN002:** não excluir forma de pagamento relacionada a parcelas ou contas.
- **RN008 — Prazo imutável na edição:** `prazoCompensacao` é definido no cadastro e **não pode ser alterado** na edição. O backend omite esse campo do schema de update.
- **RN004 (transversal):** os demais campos (`formaDePag`, `isActive`) ficam bloqueados
  para edição enquanto houver parcela, conta a pagar ou conta a receber ativas vinculadas
  — ver [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar e remover formas de pagamento.

### Gerenciar Parcelas
- **Ator:** Usuário · **RF:** RF06
- **RN002:** não excluir parcela relacionada a condições de pagamento ou contas.
- Parcelas são gerenciadas **dentro** do formulário de Condição de Pagamento (RN003–RN006 aplicadas no conjunto); o endpoint standalone `/api/parcelas` permanece para consultas e ajustes avulsos.
- **RN003 (transversal):** cancelar uma parcela exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- Parcela **não** é alvo do [RN004 transversal](#regras-de-negócio-transversais):
  `ContasAPagar`/`ContasAReceber` guardam apenas `codFormaDePag` (não `codParcela` — o
  vínculo formal foi removido, ver migration `fix-contas-a-pagar`), então nenhuma tabela
  referencia uma parcela específica; permanece livremente editável.
- **Pós-condição:** cadastrar, consultar, editar e **cancelar** parcelas.

### Gerenciar Fornecedores
- **Ator:** Usuário · **RF:** RF07
- **RN002:** não excluir fornecedor relacionado a produtos, contas a pagar ou notas fiscais.
- **RN004 (transversal):** edição bloqueada enquanto houver compra, conta a pagar ou nota
  fiscal ativas vinculadas — ver [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar, remover fornecedores e **listar
  produtos / contas a pagar** do fornecedor.

### Gerenciar Clientes
- **Ator:** Usuário · **RF:** RF08
- **RN002:** não excluir cliente relacionado a contas a receber ou compras.
- **RN004 (transversal):** edição bloqueada enquanto houver conta a receber ativa
  vinculada — ver [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar e remover clientes, incluindo
  **consulta de condições de pagamento**.

### Gerenciar Produtos
- **Ator:** Usuário · **RF:** RF09
- **RN002:** não excluir produto relacionado a compras, fornecedores ou notas fiscais.
- **RN003 — Ao menos uma categoria:** deve permitir vinculação de **categorias e
  fornecedores** ao produto. A relação Produto × Categoria é **N:N**: o produto tem uma
  **lista** de categorias, com **no mínimo uma**, gerenciada de forma embutida e atômica
  dentro do formulário de produto (mesmo padrão de Condição de Pagamento × Parcelas).
  Categoria repetida na mesma lista é recusada com 400. O botão "Salvar" fica bloqueado
  enquanto não houver ao menos uma categoria.
- **RN004 — Estoque e custo imutáveis na edição:** `estoque` e `custoMedioProd` são informados no cadastro (valor inicial) e **não podem ser alterados** por edição direta. Após a criação, somente **compras** alteram esses valores (movimentação de estoque / custo médio ponderado). O backend omite esses campos do schema de update.
- **RN005 (transversal, ver [RN004 transversal](#regras-de-negócio-transversais)):** os
  demais campos (`produto`, `undProduto`, `pesoBruto`, `pesoLiq`, `isActive`, lista de
  categorias) ficam bloqueados para edição enquanto houver compra ou nota fiscal ativas
  vinculadas ao produto. A categoria (`Categorias`) segue a mesma regra: sua edição fica
  bloqueada enquanto houver produto ativo vinculado a ela.
- **Pós-condição:** cadastrar, consultar, editar, remover produtos e fornecedores/categorias vinculados.

### Gerenciar Transportadoras
- **Ator:** Usuário · **RF:** RF10
- **RN002:** não excluir transportadora relacionada a veículos ou notas fiscais.
- **RN004 (transversal):** edição bloqueada enquanto houver compra ou nota fiscal ativas
  vinculadas — ver [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar, remover transportadoras e **listar veículos**.

### Gerenciar Contas a Pagar
- **Ator:** Usuário · **RF:** RF11
- **RN003 (transversal):** `cancelarContaPagar()` exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- **RN004 — Cancelamento só antes da baixa:** `cancelarContaPagar()` só é permitido
  enquanto `valorBaixa`/`dtBaixa` ainda estiverem nulos (título não pago); um título já
  baixado não pode ser cancelado.
- **Pós-condição:** cadastrar, consultar, editar, remover e **cancelar** contas a pagar.

### Gerenciar Contas a Receber
- **Ator:** Usuário · **RF:** RF12
- **RN003 (transversal):** `cancelarContaReceber()` exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- **RN004 — Cancelamento só antes da baixa:** `cancelarContaReceber()` só é permitido
  enquanto `valorBaixa`/`dtBaixa`/`dtPagamento` ainda estiverem nulos (título não
  recebido); um título já baixado não pode ser cancelado.
- **Pós-condição:** cadastrar, consultar, editar, remover e **cancelar** contas a receber.

### Gerenciar Ordem de Serviço
- **Atores:** Usuário, **Técnico**, **Cliente** (cada um em fluxo próprio) · **RF:** RF16
- **Lote OS-A (abertura, consulta, diagnóstico):**
  - **RN001 — Abertura atômica:** `abrirOS()` cria o cabeçalho da OS e, na mesma
    transação (RNF06), os registros de `Aparelhos` e `Equipamentos` daquela unidade —
    os três nascem ou não nascem juntos.
  - **RN002 — Chave informada:** `numOdS` é informado pelo requisitante na abertura
    (chave natural, não gerada pelo banco); duplicidade é rejeitada (409 PT — mesmo
    padrão de `Compras`/`ContasAPagar`/`ContasAReceber`).
  - **RN003 — Diagnóstico não é edição livre:** `registrarDiagnosticoOS()` é operação
    dedicada (não passa pelo `Update` genérico) — atualiza `obsTecnica`,
    `historicoManutencao`, preenche `dtAtendimento` (na primeira vez) e reconcilia a
    checklist de `ProcedimentosOdS` por diferença de conjuntos (chave
    `codProcedimento`), mesmo padrão de Condição de Pagamento × Parcelas.
  - **Pós-condição:** consultar, abrir e registrar diagnóstico de ordens de serviço.
- **Lotes OS-B/OS-C (execução, aprovação, encerramento, entrega, cancelamento):**
  regras de negócio detalhadas quando cada lote for implementado — ver
  [Roadmap](09-roadmap.md#fase-os--ordem-de-serviço-⭐-módulo-central-da-kaneko-informática).

### Gerenciar Compras
- **Ator:** Usuário · **RF:** RF13
- **RN002:** a geração de NF-e só aparece **após validação completa** da compra.
- **RN003:** compra com nota fiscal já gerada mostra opção apenas para **consultar/solicitar**.
- **RN004 — Data de chegada:** `dtChegada` não pode ser **anterior** a `dtEmissao`
  (pode ser igual ou posterior a ela) e deve estar **entre `dtEmissao` e a data
  atual** — não é permitida data de chegada futura.
- **RN005 — Classificação única da compra:** toda compra tem exatamente uma
  classificação (`codClassificacaoCompra` → `ClassificacoesCompra`: **obra-prima**,
  **revenda** ou **serviços**); não é permitido misturar produtos de
  classificações/propósitos diferentes numa mesma compra (nota fiscal). Por ser
  "exatamente uma", a relação é FK 1:N — não uma associativa, que tornaria o estado
  proibido representável no banco.
- **RN006 — Condição de pagamento herdada do fornecedor:** ao selecionar o
  fornecedor, `codCondDePag` é pré-preenchido com a condição de pagamento cadastrada
  nele; o usuário pode **alterá-la apenas para aquela compra** — a alteração não é
  gravada de volta no cadastro do fornecedor, que permanece íntegro para consultas
  futuras.
- **RN007 — Validação prévia dos códigos do documento:** numa **nova** compra, os
  demais campos do formulário só são liberados para edição depois que `numero`/
  `modelo`/`serie` forem validados (formato e inexistência prévia no banco) via
  consulta dedicada.
- **RN008 — Exclusão consultável:** ao excluir uma compra, o formulário é
  apresentado em **modo de consulta** antes de confirmar a exclusão da lista de
  compras.
- **RN009 — Custos adicionais antes dos produtos:** os custos adicionais (`frete`,
  `seguro`, `despesas`) são apresentados **antes** da tabela de produtos no
  formulário, pois compõem o rateio de custo aplicado a cada item.
- **RN010 — Total após os subtotais:** o total geral da compra é apresentado
  **depois** dos subtotais que o compõem (condição de pagamento, subtotal dos
  produtos, despesas e demais cálculos que impactem a nota final).
- **RN011 — Rateio de produtos:** a tabela de produtos apresenta o rateio dos
  custos adicionais por item tanto em **percentual** quanto em **valor**.
- **RN003 (transversal):** `cancelarCompra()` exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar, cancelar compras e **gerar nota
  fiscal eletrônica**.

### Gerenciar Nota Fiscal
- **Atores:** Usuário, **Fornecedor, Cliente, Transportadora** (cada um em fluxo próprio).
- **RF:** RF14 · **RNF10** (emissão de NF-e).
- **RN002:** fornecedor, cliente e transportadora participam de fluxos específicos
  (solicitar, confirmar entrega).
- **RN003 (transversal):** `cancelarNotaFiscal()` exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** consultar, adicionar, editar, remover, gerar, solicitar,
  confirmar entrega/recebimento e fornecer dados de transporte da nota.

### Gerenciamento do Usuário (Cadastro)
- **Atores:** Visitante Anônimo / Usuário · **RF:** RF15
- **RN001:** visitante anônimo pode **registrar conta** e acessar recursos limitados.
- **RN002:** usuário logado pode entrar, editar, mudar senha, sair e acessar consultas.
- **Ativação:** "Entrar na Conta", "Registrar Conta" ou menu de gerenciamento do usuário.
- **Pós-condição:** usuário autenticado ou conta gerenciada com sucesso.
- Detalhamento em [Segurança e Autenticação](08-seguranca-e-autenticacao.md).

## Documentos relacionados

- [Requisitos](04-requisitos.md) — RF/RNF associados a cada caso de uso.
- [Modelo de Domínio](05-modelo-de-dominio.md) — operações que implementam cada fluxo.
- [Segurança e Autenticação](08-seguranca-e-autenticacao.md) — RN001, RN003 e papéis de ator.
