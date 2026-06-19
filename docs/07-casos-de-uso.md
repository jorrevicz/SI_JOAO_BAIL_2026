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

Pré-condição comum: **usuário previamente cadastrado** (respeitando RN001).
Ativação comum: **clicar no item de menu** correspondente.

## Catálogo de casos de uso

### Gerenciar Países
- **Ator:** Usuário · **RF:** RF01
- **RN002:** não excluir país relacionado a estados/cidades.
- **Pós-condição:** cadastrar, consultar, editar e remover países.

### Gerenciar Estados
- **Ator:** Usuário · **RF:** RF02
- **RN002:** não excluir estado relacionado a cidades, fornecedores, etc.
- **Pós-condição:** cadastrar, consultar, editar e remover estados.

### Gerenciar Cidades
- **Ator:** Usuário · **RF:** RF03
- **RN002:** não excluir cidade relacionada a clientes, fornecedores, transportadoras, etc.
- **Pós-condição:** cadastrar, consultar, editar e remover cidades.

### Gerenciar Veículos
- **Ator:** Usuário · **RF:** RF04
- **RN002:** não excluir veículo relacionado a transportadoras ou notas fiscais.
- **Pós-condição:** cadastrar, consultar, editar e remover veículos.

### Gerenciar Condições de Pagamento
- **Ator:** Usuário · **RF:** RF05
- **RN002:** não excluir condição relacionada a parcelas ou compras.
- **Pós-condição:** cadastrar, consultar, editar e remover condições de pagamento.

### Gerenciar Parcelas
- **Ator:** Usuário · **RF:** RF06
- **RN002:** não excluir parcela relacionada a condições de pagamento ou contas.
- **Pós-condição:** cadastrar, consultar, editar e **cancelar** parcelas.

### Gerenciar Fornecedores
- **Ator:** Usuário · **RF:** RF07
- **RN002:** não excluir fornecedor relacionado a produtos, contas a pagar ou notas fiscais.
- **Pós-condição:** cadastrar, consultar, editar, remover fornecedores e **listar
  produtos / contas a pagar** do fornecedor.

### Gerenciar Clientes
- **Ator:** Usuário · **RF:** RF08
- **RN002:** não excluir cliente relacionado a contas a receber ou compras.
- **Pós-condição:** cadastrar, consultar, editar e remover clientes, incluindo
  **consulta de condições de pagamento**.

### Gerenciar Produtos
- **Ator:** Usuário · **RF:** RF09
- **RN002:** não excluir produto relacionado a compras, fornecedores ou notas fiscais.
- **RN003:** deve permitir vinculação de **categorias e fornecedores** ao produto.
- **Pós-condição:** cadastrar, consultar, editar, remover produtos e fornecedores/categorias vinculados.

### Gerenciar Transportadoras
- **Ator:** Usuário · **RF:** RF10
- **RN002:** não excluir transportadora relacionada a veículos ou notas fiscais.
- **Pós-condição:** cadastrar, consultar, editar, remover transportadoras e **listar veículos**.

### Gerenciar Contas a Pagar
- **Ator:** Usuário · **RF:** RF11
- **RN002:** não excluir conta a pagar relacionada a parcelas ou fornecedores.
- **Pós-condição:** cadastrar, consultar, editar, remover e **cancelar** contas a pagar.

### Gerenciar Contas a Receber
- **Ator:** Usuário · **RF:** RF12
- **RN002:** não excluir conta a receber relacionada a parcelas ou clientes.
- **Pós-condição:** cadastrar, consultar, editar, remover e **cancelar** contas a receber.

### Gerenciar Compras
- **Ator:** Usuário · **RF:** RF13
- **RN002:** a geração de NF-e só aparece **após validação completa** da compra.
- **RN003:** compra com nota fiscal já gerada mostra opção apenas para **consultar/solicitar**.
- **Pós-condição:** cadastrar, consultar, editar, cancelar compras e **gerar nota
  fiscal eletrônica**.

### Gerenciar Nota Fiscal
- **Atores:** Usuário, **Fornecedor, Cliente, Transportadora** (cada um em fluxo próprio).
- **RF:** RF14 · **RNF10** (emissão de NF-e).
- **RN002:** fornecedor, cliente e transportadora participam de fluxos específicos
  (solicitar, confirmar entrega).
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
- [Segurança e Autenticação](08-seguranca-e-autenticacao.md) — RN001 e papéis de ator.
