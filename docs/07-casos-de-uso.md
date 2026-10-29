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
  (`cancelarCompra()` — que também exclui as contas a pagar da compra —, `cancelarContaReceber()`,
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

- **RN005 — Sem estado "pendente":** compras, contas (a pagar/receber) e ordens de
  serviço **não possuem estado intermediário "pendente"** (meio-termo). Cada documento
  está sempre em um estado definido do seu ciclo — Compras: nascem `lançadas`
  e só podem ser canceladas (ver [Gerenciar Compras](#gerenciar-compras), RN013); Contas: nascem baixadas
  e só podem ser canceladas — a pagar, só pelo cancelamento da compra (cancelamento derivado de `justificativaCancelamento`, sem coluna
  de status "pendente"); OS: máquina de estados própria (ver [Gerenciar Ordem de Serviço](#gerenciar-ordem-de-serviço)).
- **RN006 — Datas no padrão `dd/mm/aa`:** toda data exibida na interface segue o padrão
  brasileiro `dd/mm/aa` ([RNF14](04-requisitos.md#requisitos-não-funcionais)).

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
- **RN002:** não excluir condição relacionada a clientes ou compras. As **parcelas não bloqueiam** a exclusão: não existem sem a condição, então são removidas (soft delete) junto com ela, na mesma transação.
- **RN003 — Parcela obrigatória:** toda condição deve ter ao menos uma parcela; condição sem parcelas é rejeitada (400).
- **RN004 — Ordenação de dias:** os `numDias` das parcelas devem ser estritamente crescentes (sem dias repetidos).
- **Número da parcela manual:** cada parcela tem `numParcela` **informado manualmente** (sem geração automática), único por condição (chave composta com `codCondDePag`); número repetido é rejeitado. Não há exigência de ordem de registro, mas os `numDias` devem crescer com o número: a parcela de número maior não pode ter dias menores (nem iguais) aos da anterior (400).
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
- Parcelas são gerenciadas **dentro** do formulário de Condição de Pagamento (RN003–RN006 aplicadas no conjunto); o endpoint standalone `/api/parcelas` permanece para consultas e ajustes avulsos (`/api/parcelas/:codCondDePag/:numParcela`).
- **Código manual, sem geração automática:** o `numParcela` é digitado pelo usuário; o banco não o gera. Número repetido é rejeitado (409); reutilizar o número de uma parcela removida (soft delete) a reativa.
- **RN003 (transversal):** cancelar uma parcela exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- **RN007 — Cancelamento só antes do pagamento:** uma parcela só pode ser **cancelada
  enquanto não tiver sido paga** — isto é, enquanto o título gerado a partir dela
  (conta a pagar/receber) não tiver `valorBaixa`/`dtBaixa`. *Observação:* como as contas
  agora nascem já baixadas, esta regra deixou de ter efeito prático para títulos novos
  (ver [Contas a Pagar](#gerenciar-contas-a-pagar), RN004).
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
- **RN004 — Estoque e custo imutáveis na edição:** `estoque` e o custo inicial (`custoProd`) são informados no cadastro e **não podem ser alterados** por edição direta; `custoMedioProd` nasce 0 e não é informado. Após a criação, somente **compras lançadas** alteram esses valores (movimentação de estoque / custo médio ponderado / custo da última compra). O backend omite esses campos do schema de update. O **preço de venda** (`precoVenda`) é obrigatório e editável, mas segue o bloqueio da RN005 abaixo (RN004 transversal), como os demais campos.
- **RN005 (transversal, ver [RN004 transversal](#regras-de-negócio-transversais)):** os
  demais campos (`produto`, `undProduto`, `pesoBruto`, `pesoLiq`, `precoVenda`, `isActive`,
  lista de categorias) ficam bloqueados para edição — e o produto não pode ser excluído —
  quando houver compra ou nota fiscal vinculada ao produto. Como o sistema trabalha com
  soft delete, o vínculo em `CompraProduto` permanece mesmo depois que a compra
  é cancelada, e continua protegendo o produto (decisão do responsável pelo projeto). A categoria (`Categorias`) segue a mesma regra: sua edição fica
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
- **RN003 (transversal):** a exclusão da conta a pagar acontece dentro de
  `cancelarCompra()`, que exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- **RN004 — Conta nasce já baixada (sem estado "em aberto"):** `valorBaixa` e `dtBaixa`
  são **obrigatórios no cadastro** — o botão do formulário passa a ser **Lançar conta** e
  grava a conta já baixada (valor em branco = `vlrTotal` calculado pelo Backend). Não há
  edição, exclusão nem baixa posterior (`PUT`, `DELETE` e `PATCH .../baixa` removidos).
- **RN007 — Exclusão só a partir da compra cancelada:** a conta a pagar **não** pode ser
  cancelada nem excluída pela própria tela/API de Contas a Pagar (`PATCH .../cancelar`
  removido; a listagem só tem **Consultar**). Ela é excluída (soft delete:
  `isActive = false` + justificativa da compra) **somente** pelo cancelamento da compra
  do mesmo documento (`numero`, `modelo`, `serie`, fornecedor — ver
  [Gerenciar Compras](#gerenciar-compras), RN014): na mesma transação, o service de
  contas valida que a **compra relacionada está desativada** (409 se ainda ativa) e
  cancela cada parcela pela **chave primária completa**. Conta a pagar sem compra
  correspondente permanece ativa.
- **RN005 — Data da baixa no lugar da emissão:** a conta **não tem `dtEmissao`** (migration
  `remove-data-emissao-das-contas`): como nasce já baixada, `dtBaixa` ocupa esse papel.
  `dtVencimento` e `dtBaixa` são obrigatórios, armazenados como `TimestampTz(3)` (data **e
  hora**, com fuso explícito). Não há checagem cruzada entre as duas datas — pagar depois
  do vencimento é legítimo (com juro e multa). O Frontend usa
  `<input type="datetime-local">` (sempre em UTC — ver princípio de datas em
  [docs/06](06-modelo-de-dados.md#princípios-de-modelagem)) e pré-preenche, na criação, o
  vencimento com o fim do dia de hoje (23:59 UTC) e a baixa com a data/hora atual.
- **RN006 — Ordenação da listagem:** a listagem é ordenada por **fornecedor**, depois
  por **número da nota** (`numero`) e, por fim, por **número da parcela** (`parcela`).
- **Pós-condição:** cadastrar (já baixada) e consultar contas a pagar; a exclusão vem do
  cancelamento da compra.

### Gerenciar Contas a Receber
- **Ator:** Usuário · **RF:** RF12
- **RN003 (transversal):** `cancelarContaReceber()` exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- **RN004 — Conta nasce já baixada (sem estado "em aberto"):** `valorBaixa` e `dtBaixa`
  são **obrigatórios no cadastro** (botão **Lançar conta**); não há edição,
  exclusão nem baixa posterior — mesma regra de
  [Contas a Pagar](#gerenciar-contas-a-pagar). Só o cancelamento
  (`cancelarContaReceber()`, 409 se já cancelada) é permitido.
- **RN005 — Data da baixa no lugar da emissão:** mesma regra de Contas a Pagar (sem
  `dtEmissao`; `dtVencimento` e `dtBaixa` obrigatórios, sem checagem cruzada) — ver RN005 de [Gerenciar Contas a Pagar](#gerenciar-contas-a-pagar).
- **RN006 — Ordenação da listagem:** a listagem é ordenada por **cliente**, depois por
  **número da nota** (`numero`) e, por fim, por **número da parcela** (`parcela`).
- **Pós-condição:** cadastrar, consultar, editar, remover e **cancelar** contas a receber.

### Gerenciar Ordem de Serviço
- **Atores:** Usuário, **Técnico**, **Cliente** (cada um em fluxo próprio) · **RF:** RF16
- **Lote OS-A (abertura, consulta, diagnóstico):**
  - **RN001 — Abertura atômica:** `abrirOS()` cria o cabeçalho da OS e, na mesma
    transação (RNF06), o registro de `Aparelhos` daquela unidade — os dois nascem ou não
    nascem juntos. A ficha de `Equipamentos` não é criada aqui: é levantada no
    diagnóstico (ver RN003) e `OrdemDeServicos.codEquipamento` nasce nulo.
  - **RN002 — Chave gerada:** `numOdS` é um inteiro auto-incrementado pelo banco
    (`INTEGER GENERATED BY DEFAULT AS IDENTITY`) na abertura — o requisitante não informa nem valida
    formato de número de OS (diferente do padrão de chave natural informada de
    `Compras`/`ContasAPagar`/`ContasAReceber`).
  - **RN003 — Diagnóstico não é edição livre:** `registrarDiagnosticoOS()` é operação
    dedicada (não passa pelo `Update` genérico) — atualiza `historicoManutencao`,
    preenche `dtAtendimento` (na primeira vez), preenche a checagem (`posicao` —
    opcional —, `checagem`, `obsProcedimento`, `dthFim` — informados pelo técnico) de itens **já
    existentes** na checklist de `ProcedimentosOdS` (ver RN009 — não adiciona, remove nem
    reordena) e reconcilia, por diferença de conjuntos, o orçamento de peças
    `OrcamentoPecasOdS` (chave `codPeca`) — o orçamento é cotado já na inspeção, junto do
    diagnóstico; registra a ficha técnica do `Equipamento` quando informada (opcional —
    cria e vincula à OS na primeira vez, atualiza nas seguintes; sem ela a OS segue sem
    Equipamento); ao final recalcula `situacao` (`Aguardando aprovação` se houver peça
    orçada ainda não decidida pelo cliente, `Em execução` caso contrário), mesmo padrão
    de Condição de Pagamento × Parcelas.
  - **RN009 — Estrutura da checklist é operação própria:** `definirProcedimentosOS()`
    define quais procedimentos entram na checklist de uma OS e em que ordem
    (`codProcedimento`/`ordem`), reconciliando por diferença de conjuntos (mesmo padrão
    de Parcelas) — independente do diagnóstico, que apenas herda essa lista e nunca a
    altera (não adiciona, remove nem reordena itens).
  - **RN010 — Checagem negativa exige observação:** no diagnóstico, um item com
    `checagem = false` só é aceito se `obsProcedimento` estiver preenchido — não é
    possível marcar um procedimento como não confirmado sem justificar.
  - **Pós-condição:** consultar, abrir, definir a estrutura da checklist e registrar
    diagnóstico (incluindo orçamento de peças) de ordens de serviço.
- **Lote OS-B (execução, aprovação):**
  - **RN005 — `tipoOdS` não é status:** `tipoOdS` classifica a OS livremente (ex.:
    "Garantia") e é definido uma única vez na abertura; `situacao` é a máquina de
    estados do atendimento, avança sozinha conforme as operações abaixo são chamadas e
    nunca é editável diretamente pelo formulário.
  - **RN006 — Execução reconcilia serviços e registra as observações finais:**
    `registrarExecucaoOS()` é operação dedicada que reconcilia, por diferença de
    conjuntos (mesmo padrão de `ProcedimentosOdS`/Parcelas), `ServicosOdS` (chave
    `codServico`) e atualiza `obsTecnica` — as observações técnicas registradas ao fim
    do atendimento, depois que o trabalho foi concluído.
  - **RN007 — Aprovação de orçamento é por item:** o cliente decide peça a peça, via
    operações dedicadas `aprovarOrcamentoPeca()` (marca `aprovado = true`) e
    `reprovarOrcamentoPeca()` (remove/soft delete a linha — a peça sai do orçamento
    ativo); não há aprovação em bloco nem edição via `Update` genérico. Cada decisão
    recalcula `situacao`.
  - **RN008 — Substituição de peça exige orçamento aprovado:**
    `registrarSubstituicaoPecasOS()` é lançamento manual do técnico, com os valores
    reais aplicados (podem divergir do orçamento), reconciliado por diferença de
    conjuntos (chave `codPeca`, mesma filosofia de Parcelas × Condição de Pagamento);
    só aceita peça com `OrcamentoPecasOdS.aprovado = true` para aquela OS — caso
    contrário, 409 PT.
  - **Pós-condição:** gerenciar cadastros de apoio (`Cargos`, `Funcionarios`,
    `Servicos`, `Pecas`), registrar execução de serviços/peças, aprovar/reprovar
    orçamento de peças e registrar substituição efetiva de peças.
- **Lote OS-C (encerramento, entrega, cancelamento):** regras de negócio detalhadas
  quando o lote for implementado — ver
  [Roadmap](09-roadmap.md#fase-os--ordem-de-serviço-⭐-módulo-central-da-kaneko-informática).

### Gerenciar Compras
- **Ator:** Usuário · **RF:** RF13
- **RN002:** a geração de NF-e só aparece **após validação completa** da compra — como a
  compra nasce lançada (RN013), a ação **Gerar NF-e** aparece para toda compra **não
  cancelada** e sem nota ativa; o Backend recusa (409) gerar nota de compra cancelada.
- **RN003:** compra com nota fiscal já gerada — ativa **ou cancelada** — mostra opção
  apenas para **consultar** a nota (**Consultar NF-e** no lugar de **Gerar NF-e**): a NF-e
  usa as mesmas chaves da compra como chave primária, então cada compra tem no máximo uma
  nota e o Backend recusa (409) gerar outra. Enquanto a nota estiver ativa, a compra **não
  pode ser cancelada** (o Backend responde 409 e a tela exibe a mensagem) — cancele a nota
  primeiro; depois disso a compra pode ser cancelada (e relançada com outro documento).
- **RN004 — Data de chegada:** `dtChegada` não pode ser **anterior** a `dtEmissao`
  (pode ser igual ou posterior a ela) e deve estar **entre `dtEmissao` e a data
  atual** — não é permitida data de chegada futura.
- **RN006 — Condição de pagamento herdada do fornecedor:** ao selecionar o
  fornecedor, `codCondDePag` é pré-preenchido com a condição de pagamento cadastrada
  nele; o usuário pode **alterá-la apenas para aquela compra** — a alteração não é
  gravada de volta no cadastro do fornecedor, que permanece íntegro para consultas
  futuras.
- **RN007 — Validação prévia dos códigos do documento:** numa **nova** compra, os
  demais campos do formulário só são liberados para edição depois que `numero`/
  `modelo`/`serie` forem validados (formato e inexistência prévia no banco) via
  consulta dedicada.
- **RN008 — (removida):** a compra não é mais excluída — sem estado "aberto", não há
  rascunho a descartar; a compra lançada só é cancelada (RN014). O número é mantido para
  não renumerar as demais regras.
- **RN009 — (removida):** a regra de posição das despesas (frete, seguro e outras
  despesas) deixou de existir; no formulário atual elas aparecem **depois** da tabela de
  produtos (ver RN019 e RN021). São rateadas entre os produtos (RN011) e somam-se ao total
  da compra. O número é mantido para não renumerar as demais regras.
- **RN010 — (removida):** a regra de apresentação do total da compra foi retirada. O total
  (`vlrTotal` = total dos produtos + frete + seguro + outras despesas) é exibido logo abaixo
  das despesas. O número é mantido para não renumerar as demais regras.
- **RN011 — Rateio de despesas nos produtos:** a tabela de produtos apresenta o rateio de
  cada produto tanto em **percentual** (fatia do produto no total dos produtos) quanto em
  **valor**: `valor do rateio = ( valor do produto ÷ total dos produtos ) × ( frete + seguro +
  despesas )`, em que o valor do produto é `( valor unitário − desconto ) × quantidade`. O
  custo unitário do item é `( valor do produto + valor do rateio ) ÷ quantidade`.
- **RN012 — Total dos produtos junto à tabela:** o **total dos produtos**
  (Σ ( valor unitário − desconto ) × quantidade de cada item) é exibido **logo após a tabela de
  produtos**, visível junto aos totais por coluna da própria tabela. A linha de totais cobre todas as colunas numéricas: quantidade, valor unitário,
  desconto, valor líquido, rateio (% e R$) e custo unitário — calculados no Backend.
- **RN013 — Lançamento direto, sem estado "aberto":** a compra **não tem rascunho nem
  edição**: não existe estado "aberto" (nem "pendente" — RN005 transversal) e a coluna
  `situacao` não existe. No formulário, o botão **Lançar compra** substitui o antigo
  "Salvar": ele cadastra a compra e efetiva a entrada numa única transação (RNF06) —
  grava cabeçalho, itens e parcelas, soma as quantidades ao estoque, recalcula o custo
  médio ponderado, atualiza o custo da última compra de cada produto e preenche
  `dtEntrada` — e **não gera Contas a Pagar** (cadastradas à parte). Antes de lançar o
  Frontend pede confirmação. Não há `PUT`, `DELETE` nem `PATCH .../lancar`: a compra
  lançada só pode ser **cancelada** (com estorno de estoque e custo médio — RN014).
- **RN014 — Fluxo de cancelamento:** o botão **Cancelar** abre o formulário da compra
  em **modo de consulta**; o botão de lançar é trocado por **Confirmar cancelamento**;
  o usuário informa a **justificativa** (`justificativaCancelamento`) e, por fim, um
  **popup de login/confirmação** valida a identidade — só então o cancelamento é
  efetivado (RN003 transversal). **Antes de qualquer operação de cancelamento é
  necessário fazer login novamente** (reautenticação). Toda compra ainda
  não cancelada pode ser cancelada; o cancelamento **desativa** o registro (`isActive = false`,
  que continua visível nas consultas com a justificativa) e, na mesma transação, **exclui
  as contas a pagar** do mesmo documento (cada parcela pela chave primária completa, com a
  justificativa da compra — único caminho de exclusão de conta a pagar, ver
  [Gerenciar Contas a Pagar](#gerenciar-contas-a-pagar), RN007); o cancelamento estorna estoque e custo médio de cada item (409 se o
  estoque atual já não comportar a quantidade comprada). Até o EP-10 o popup de senha
  é só do Frontend (o Backend ainda não confere a senha).
- **RN015 — Saldo e preço de venda ao final:** ao final do formulário a compra
  apresenta, por item, o **saldo** (estoque resultante do produto após a entrada) e o
  **preço de venda** cadastrado no produto (`Produtos.precoVenda`), ao lado do novo
  custo unitário, para conferência da margem.
- **RN016 — Desconto apenas por item:** o desconto é aplicado **somente por item** da
  compra (`CompraProduto`); não existe desconto geral sobre a compra.
- **RN017 — (removida):** o frete não é mais definido acima da tabela de produtos; fica
  junto de `seguro` e `despesas`, depois dela. O número é mantido para não renumerar as
  demais regras.
- **RN018 — Data da operação:** a data da operação equivale à **entrada da compra**
  (`dtEntrada`).
- **RN019 — Bloqueio do documento fiscal após adicionar produto:** assim que o usuário
  adiciona o **primeiro produto** à compra, os campos do documento fiscal
  (`numero`/`modelo`/`serie`, fornecedor, transportadora e as datas de emissão e chegada)
  ficam **bloqueados para edição**; as despesas (`frete`, `seguro`, `despesas`) passam a
  aparecer, editáveis, abaixo da tabela de produtos, seguidas do total da compra. O
  documento só volta a ser editável se todos os produtos forem removidos (ou, no caso das
  datas, após gerar as parcelas — RN021).
- **RN020 — Unidade do produto definida na compra:** o usuário pode **informar o tipo de
  unidade** (`unidade`, ex.: `UN`, `CX`, `KG`) de cada produto na compra, pois a unidade
  em que o fornecedor vende pode diferir da unidade de venda cadastrada em
  `Produtos.undProduto`. O campo é pré-preenchido com `undProduto` ao selecionar o
  produto, é editável **apenas naquele item da compra** e **não sobrescreve** o cadastro
  do produto (mesma filosofia da RN006).
- **RN021 — Bloqueio após gerar as parcelas:** depois de **gerar as parcelas** da
  compra, tudo o que está acima delas — **documento fiscal (RN019), produtos** (incluindo
  adicionar, editar e remover itens), **despesas** (`frete`, `seguro`, `despesas`) e
  **condição de pagamento** — fica **bloqueado para edição**, pois o parcelamento é
  calculado sobre o total já fechado (`vlrTotal`). Só os campos de **data de emissão e de
  chegada** (ao final do formulário) são liberados para preenchimento. Voltar à edição das
  seções bloqueadas exige **descartar as parcelas geradas** (com confirmação).
- **RN022 — Geração automática das parcelas da compra** (`POST /api/compras/parcelas`): a partir da **condição de
  pagamento selecionada pela consulta** (RN006), o usuário pode **gerar automaticamente
  as parcelas** numa **tabela dentro do formulário de compras**. Cada parcela da
  condição (`Parcelas`: `numParcela`, `percentual`, `numDias`, `codFormaDePag`) vira uma
  linha com `valor = vlrTotal × percentual` (centavos residuais distribuídos pelos
  maiores restos, para a soma fechar no `vlrTotal`) e vencimento = data de emissão +
  `numDias`. O cálculo é feito **no Backend** (mesma regra do cálculo da compra).
- **RN023 — Parcelas ajustáveis só na compra:** o usuário pode **ajustar as parcelas**
  geradas (valor, vencimento, forma de pagamento, adicionar ou remover linhas), assim
  como edita os produtos. As edições valem **somente para aquela compra** e **nunca
  sobrescrevem** a condição de pagamento original nem suas `Parcelas` cadastradas.
  Invariantes: ao menos 1 parcela, vencimentos estritamente crescentes e **soma dos
  valores igual ao `vlrTotal`**; o Frontend exibe o total ao vivo e bloqueia o salvamento
  enquanto a soma divergir (padrão de Condição de Pagamento × Parcelas).
- **RN003 (transversal):** `cancelarCompra()` exige reautenticação — ver
  [regras transversais](#regras-de-negócio-transversais).
- **Pós-condição:** cadastrar, consultar, editar, cancelar compras e **gerar nota
  fiscal eletrônica**.

### Gerenciar Nota Fiscal
- **Atores:** Usuário, **Fornecedor, Cliente, Transportadora** (cada um em fluxo próprio).
- **RF:** RF14 · **RNF10** (emissão de NF-e).
- **Escopo implementado (Lote C-5):** NF-e de **entrada**, gerada a partir de uma compra
  lançada (ação **Gerar NF-e** da listagem de Compras), consultada e cancelada na tela
  **Notas Fiscais**. Não há NF-e avulsa, edição nem exclusão. A nota é identificada pelas
  **mesmas chaves da compra** (`modelo`, `numero`, `serie`, `codFornecedor`).
- **Geração:** documento, emitente, transporte e despesas vêm da compra (somente leitura).
  O usuário informa a chave de acesso (44 dígitos, dígito verificador válido e com o
  modelo/série/número da compra), a emissão (pré-preenchida com a
  da compra), a saída (opcional, não anterior à emissão), o frete por conta e as
  informações complementares; por item, CFOP de entrada (1xxx/2xxx/3xxx), CSOSN e
  alíquotas de ICMS/IPI. Os itens são exatamente os produtos da compra (quantidade, valor
  e desconto copiados). Base, ICMS, IPI e totais são calculados **no Backend**
  (`POST /api/notas-fiscais/calculo` para a prévia); a gravação é transacional (RNF06).
- **RN002:** fornecedor, cliente e transportadora participam de fluxos específicos
  (solicitar, confirmar entrega) — **pendentes (T-093)**, assim como a emissão junto à
  SEFAZ (T-094, fora do MVP).
- **RN003 (transversal):** `cancelarNotaFiscal()` exige justificativa e reautenticação —
  ver [regras transversais](#regras-de-negócio-transversais); até o EP-10 o popup de senha
  é só do Frontend. O cancelamento desativa a nota (`isActive = false`), que continua
  visível nas consultas; cancelar uma já cancelada → 409.
- **Pós-condição:** consultar, gerar e cancelar a nota de entrada da compra. Pendentes:
  editar, solicitar, confirmar entrega/recebimento e fornecer dados de transporte.

### Gerenciamento do Usuário (Cadastro)
- **Atores:** Usuário · **RF:** RF15
- **RN001:** o usuário pode **registrar conta**.
- **RN002:** usuário logado pode entrar, editar, mudar senha, sair e acessar consultas.
- **Ativação:** "Entrar na Conta", "Registrar Conta" ou menu de gerenciamento do usuário.
- **Pós-condição:** usuário autenticado ou conta gerenciada com sucesso.
- Detalhamento em [Segurança e Autenticação](08-seguranca-e-autenticacao.md).

## Documentos relacionados

- [Requisitos](04-requisitos.md) — RF/RNF associados a cada caso de uso.
- [Modelo de Domínio](05-modelo-de-dominio.md) — operações que implementam cada fluxo.
- [Segurança e Autenticação](08-seguranca-e-autenticacao.md) — RN001, RN003 e papéis de ator.
