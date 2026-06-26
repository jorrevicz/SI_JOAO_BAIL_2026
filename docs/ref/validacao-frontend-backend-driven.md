# Validação de formulários no Frontend reaproveitando o Zod do Backend

> **Status: implementada.** A `ApiError`, o formato de resposta 400 `{ mensagem, erros }` do
> `validate` e o componente `ErroCampo` por campo já estão no código, nos três formulários
> geográficos. As seções abaixo registram a **decisão** e descrevem a mudança que foi aplicada;
> a seção [Verificação](#verificação) serve de roteiro de regressão.

## Contexto e decisão

As telas de cadastro geográfico (Países, Estados, Cidades) e seus formulários
(`PaisForm`, `EstadoForm`, `CidadeForm`) usavam apenas `required`/`maxLength` do HTML5 e, no
`catch` do submit, exibiam uma única faixa de erro (`Alerta`) com a mensagem do backend — sem
indicar **qual campo** falhou.

No Backend, cada módulo define schemas Zod v4 (`*.schema.ts`) aplicados via o middleware
`Validate` (`Backend/src/shared/validation/validate.ts`). Antes desta mudança, o middleware
**achatava** todos os erros do Zod numa só string (`issues.map(e => e.message).join('; ')`),
perdendo a informação de qual campo falhou.

Backend e Frontend são **dois pacotes npm separados** (sem monorepo/workspace) e o Frontend
**não tem Zod**. A decisão (confirmada com o usuário) foi **não duplicar schemas nem adicionar
libs no Frontend**: o Backend é a **única fonte de verdade** de validação e passou a devolver
**erros por campo** que o Frontend mapeia para cada input no submit. Isso satisfaz a UX escolhida
("erro por campo + no submit"), respeita RNF02 (≤ 2s) e elimina drift.

## Abordagem implementada (backend-driven, sem duplicação)

O Zod já entrega `issue.path` (o caminho do campo) em cada `issue`. Basta o middleware expor
isso num mapa `{ campo: mensagem }`. Como os nomes dos campos no schema Zod == nomes no payload
== nomes no `useState` dos formulários, o alinhamento Backend↔Frontend é automático.

### 1. Backend — `Validate` devolve erros por campo
Arquivo: `Backend/src/shared/validation/validate.ts`

Na ramificação de falha, além da `mensagem` agregada (manter para compatibilidade e para
erros não atrelados a campo), construir um mapa `erros`:

```ts
if ( !resultado.success ) {
  const erros: Record<string, string> = {};
  for ( const issue of resultado.error.issues ) {
    const campo = String ( issue.path[ 0 ] ?? '_' );
    if ( !( campo in erros ) ) erros[ campo ] = issue.message; // mantém a 1ª mensagem por campo
  }
  const mensagem = resultado.error.issues.map ( ( e ) => e.message ).join ( '; ' );
  res.status ( 400 ).json ( { mensagem, erros } );
  return;
}
```

Resposta 400 passa de `{ mensagem }` para `{ mensagem, erros: { pais: "...", sigla: "..." } }`.
O `errorHandler` (409 duplicado/FK, 500) **não muda** — continua só com `mensagem`, e o Frontend
trata ausência de `erros` como erro global.

### 2. Backend — atualizar o teste do middleware
Arquivo: `Backend/src/__tests__/validate.test.ts`

Manter os casos atuais e acrescentar uma asserção de que o JSON de falha inclui
`erros` com a chave do campo correto, ex.: `expect(jsonArg.erros.idade).toBe('Idade é obrigatória')`.
Verificar se algum teste de rota (paises/estados/cidades) afirma a **forma exata** do corpo de
erro 400; se afirmar, ajustar para aceitar o campo extra `erros` (asserções `toContain`/parciais
já continuam válidas).

### 3. Frontend — propagar o mapa `erros` pela camada axios
Arquivo: `Frontend/src/services/api.tsx`

Hoje o interceptor rejeita com `new Error(mensagem)`, descartando `erros`. Criar uma classe
`ApiError` que carrega o mapa e exportá-la:

```ts
export class ApiError extends Error {
  erros?: Record<string, string>;
  constructor ( mensagem: string, erros?: Record<string, string> ) {
    super ( mensagem );
    this.name = 'ApiError';
    this.erros = erros;
  }
}

api.interceptors.response.use(
  ( res ) => res,
  ( error ) => {
    const mensagem = error.response?.data?.mensagem ?? 'Erro de comunicação com o servidor.';
    const erros   = error.response?.data?.erros;
    return Promise.reject ( new ApiError ( mensagem, erros ) );
  },
);
```

Os serviços (`paises.ts`, `estados.ts`, `cidades.ts`) **não mudam** — continuam propagando a
rejeição.

### 4. Frontend — exibir erro por campo nos 3 formulários
Arquivos: `Frontend/src/pages/paises/PaisForm.tsx`,
`Frontend/src/pages/estados/EstadoForm.tsx`,
`Frontend/src/pages/cidades/CidadeForm.tsx`

Padrão único (mesma mudança nos três, exemplo em `EstadoForm`):

- Estado novo: `const [errosCampo, setErrosCampo] = useState<Record<string, string>>({});`
- No início do `submit`: `setErrosCampo({})` junto do `setErro('')`.
- No `catch`:
  ```ts
  catch (err) {
    if ( err instanceof ApiError && err.erros ) setErrosCampo ( err.erros );
    setErro ( ( err as Error ).message );
  }
  ```
- Sob cada `<input>`, dentro do respectivo `<Campo>`:
  `{errosCampo.uf && <ErroCampo>{errosCampo.uf}</ErroCampo>}` (chave = nome do campo:
  `pais/sigla/ddi/moeda`, `codPais/uf/estado`, `codEstado/cidade/ddd`).
- A faixa global `Alerta` permanece para erros **sem** `erros` (409 duplicado/FK, 500, rede).
  Opcional: só renderizar `Alerta` quando `Object.keys(errosCampo).length === 0`, evitando
  mensagem duplicada na validação 400.

### 5. Frontend — componente de mensagem de campo
Adicionar um styled-component `ErroCampo` (texto pequeno em `theme.cores.erro`) e reexportá-lo
junto dos demais (`Campo`, `Alerta`) usados pelos formulários — seguir o mesmo ponto de origem/
reexport que hoje serve `Campo`/`Alerta` para `*Form.tsx` (componente de modal compartilhado).
Reaproveitar o token `theme.cores.erro` já existente.

### 6. Docs — manter fiéis ao código
Atualizar `docs/02-arquitetura.md` (seção do padrão da API / `validate`) e, se citar a forma do
erro, `docs/03-stack-tecnologica.md`, documentando que a resposta 400 de validação agora inclui
`erros: { campo: mensagem }` e que o Frontend usa esse mapa para feedback por campo (sem
duplicar schema).

## Arquivos a alterar
- `Backend/src/shared/validation/validate.ts` (núcleo da mudança)
- `Backend/src/__tests__/validate.test.ts` (+ eventuais testes de rota que afirmem o corpo do 400)
- `Frontend/src/services/api.tsx` (`ApiError` + interceptor)
- `Frontend/src/pages/{paises,estados,cidades}/{Pais,Estado,Cidade}Form.tsx`
- Estilo compartilhado dos formulários (novo `ErroCampo`)
- `docs/02-arquitetura.md` (e possivelmente `docs/03-stack-tecnologica.md`)

## Verificação
1. **Backend:** `cd Backend && npm test` (inclui o novo caso em `validate.test.ts` e testes de
   rota) e `npm run typecheck`.
2. **Manual (com API + Vite rodando):**
   - Submeter um formulário com campos inválidos (ex.: País sem `pais`, ou `pais` > 6 chars) →
     mensagem aparece **abaixo do campo certo**, em PT, e o envio é bloqueado pelo 400.
   - Submeter um duplicado (ex.: sigla já existente) → faixa global `Alerta` com "Registro
     duplicado…" (vindo do `errorHandler`, sem `erros`).
   - Submeter dados válidos → salva e fecha o modal normalmente.
3. Confirmar que as chaves de `erros` batem com os nomes dos inputs nos três formulários.

## Alternativas consideradas (e descartadas)
- **Monorepo / npm workspace** com pacote `shared` de schemas: fonte única real, mas exige
  reestruturar a raiz em workspaces e ajustar build/tsconfig de ambos os lados — desproporcional
  para o tamanho do projeto.
- **Copiar schemas para o Frontend** (+ Zod como dep): permite validação instantânea pré-submit,
  mas reintroduz duplicação/drift.
- **Endpoint de schema via `z.toJSONSchema()`** (Zod v4) consumido por Ajv no Frontend: DRY e
  pré-submit, porém Ajv é lib fora da stack, mensagens PT e coerções (`.coerce.number()`,
  `.trim()`) não sobrevivem bem à conversão para JSON Schema.
