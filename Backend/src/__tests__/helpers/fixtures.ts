import type postgres from 'postgres';

// ============================================================
// Fixtures de teste — criam as entidades-pai reais dentro da
// transação revertida (rollback), para os testes de repositório
// não dependerem de "codPais"/"codEstado"/"codCidade" específicos
// vindos do seed (que mudam a cada recriação do banco).
//
// Toda inserção usa a transação recebida e nada é comitado: o
// withTestTransaction reverte tudo ao final de cada teste.
// ============================================================

const COD_USER_TESTE = 1;

const TOTAL_SIGLAS_POSSIVEIS = 36 * 36;

// Sequencial por arquivo de teste (cada arquivo tem seu próprio módulo), iniciado em um
// ponto aleatório para não bater com países que um teste anterior tenha deixado comitados.
let proximoSufixoPais = Math.floor ( Math.random() * TOTAL_SIGLAS_POSSIVEIS );

/**
 * "Paises" tem índices únicos em "sigla" (3 caracteres) e "ddi" (4) — um valor fixo
 * colidiria entre testes, e um sorteio colide até dentro de um mesmo teste, que cria
 * vários países (cliente, fornecedor etc.) na mesma transação. Cada chamada devolve o
 * próximo valor de uma sequência, sem repetir até esgotar as 1296 combinações.
 */
function gerarSiglaEDdiUnicos(): { sigla: string; ddi: string }
{
    const sufixo = proximoSufixoPais;

    proximoSufixoPais = ( proximoSufixoPais + 1 ) % TOTAL_SIGLAS_POSSIVEIS;

    return {
        sigla: `Z${ sufixo.toString ( 36 ).toUpperCase().padStart ( 2, '0' ) }`,
        ddi:   String ( 1000 + sufixo ),
    };
}

/**
 * Insere um país descartável e devolve o "codPais" gerado.
 */
export async function criarPaisDeTeste
(
    transaction: postgres.TransactionSql
): Promise < number >
{
    const { sigla, ddi } = gerarSiglaEDdiUnicos();

    const [ pais ] = await transaction < { codPais: number }[] >`
        INSERT INTO "Paises"
        (
            "pais",
            "sigla",
            "ddi",
            "moeda",
            "codUser"
        )
        VALUES
        (
            'TESTE',
            ${ sigla },
            ${ ddi },
            'ZZZ',
            ${ COD_USER_TESTE }
        )
        RETURNING "codPais"
    `;

    return pais.codPais;
}

/**
 * Insere país → estado e devolve o "codEstado" gerado.
 */
export async function criarEstadoDeTeste
(
    transaction: postgres.TransactionSql
): Promise < number >
{
    const codPais = await criarPaisDeTeste ( transaction );

    const [ estado ] = await transaction < { codEstado: number }[] >`
        INSERT INTO "Estados"
        (
            "codPais",
            "uf",
            "estado",
            "codUser"
        )
        VALUES
        (
            ${ codPais },
            'ZZ',
            'Estado de Teste',
            ${ COD_USER_TESTE }
        )
        RETURNING "codEstado"
    `;

    return estado.codEstado;
}

/**
 * Insere país → estado → cidade e devolve o "codCidade" gerado.
 */
export async function criarCidadeDeTeste
(
    transaction: postgres.TransactionSql
): Promise < number >
{
    const codEstado = await criarEstadoDeTeste ( transaction );

    const [ cidade ] = await transaction < { codCidade: number }[] >`
        INSERT INTO "Cidades"
        (
            "codEstado",
            "cidade",
            "ddd",
            "codUser"
        )
        VALUES
        (
            ${ codEstado },
            'Cidade de Teste',
            '11',
            ${ COD_USER_TESTE }
        )
        RETURNING "codCidade"
    `;

    return cidade.codCidade;
}

/**
 * Insere uma condição de pagamento descartável e devolve o "codCondDePag" gerado.
 */
export async function criarCondicaoDePagamentoDeTeste
(
    transaction: postgres.TransactionSql
): Promise < number >
{
    const [ condicao ] = await transaction < { codCondDePag: number }[] >`
        INSERT INTO "CondicaoDePagamento"
        (
            "descricao",
            "juroCondPag",
            "multaCondPag",
            "descontoCondPag",
            "codUser"
        )
        VALUES
        (
            'CONDIÇÃO DE TESTE',
            0,
            0,
            0,
            ${ COD_USER_TESTE }
        )
        RETURNING "codCondDePag"
    `;

    return condicao.codCondDePag;
}

/**
 * Insere cidade → condição de pagamento → fornecedor e devolve o "codForn" gerado.
 */
export async function criarFornecedorDeTeste
(
    transaction: postgres.TransactionSql
): Promise < number >
{
    const codCidade    = await criarCidadeDeTeste ( transaction );
    const codCondDePag = await criarCondicaoDePagamentoDeTeste ( transaction );

    const [ fornecedor ] = await transaction < { codForn: number }[] >`
        INSERT INTO "Fornecedores"
        (
            "codCidade",
            "codCondDePag",
            "fornecedor",
            "tipoPessoa",
            "cepForn",
            "foneForn",
            "cpfCnpjForn",
            "inscEstSubTrib",
            "codUser"
        )
        VALUES
        (
            ${ codCidade },
            ${ codCondDePag },
            'FORNECEDOR DE TESTE',
            'JURIDICA',
            '00000000',
            '00000000000',
            '00000000000000',
            '000000000000',
            ${ COD_USER_TESTE }
        )
        RETURNING "codForn"
    `;

    return fornecedor.codForn;
}

/**
 * Insere um cliente descartável e devolve o "codCliente" gerado.
 */
export async function criarClienteDeTeste
(
    transaction: postgres.TransactionSql
): Promise < number >
{
    const codCidade = await criarCidadeDeTeste ( transaction );

    const [ cliente ] = await transaction < { codCliente: number }[] >`
        INSERT INTO "Clientes"
        (
            "codCidade",
            "cliente",
            "tipoPessoa",
            "cepCl",
            "foneCl",
            "codUser"
        )
        VALUES
        (
            ${ codCidade },
            'CLIENTE DE TESTE',
            'JURIDICA',
            '00000000',
            '00000000000',
            ${ COD_USER_TESTE }
        )
        RETURNING "codCliente"
    `;

    return cliente.codCliente;
}

/**
 * Insere uma forma de pagamento descartável e devolve o "codFormaDePag" gerado.
 */
export async function criarFormaDePagamentoDeTeste
(
    transaction: postgres.TransactionSql
): Promise < number >
{
    const [ forma ] = await transaction < { codFormaDePag: number }[] >`
        INSERT INTO "FormaDePagamento"
        (
            "formaDePag",
            "prazoCompensacao",
            "codUser"
        )
        VALUES
        (
            'FORMA DE TESTE',
            0,
            ${ COD_USER_TESTE }
        )
        RETURNING "codFormaDePag"
    `;

    return forma.codFormaDePag;
}

/**
 * Insere uma categoria descartável e devolve o "codCategoria" gerado.
 * O nome não pode conter dígitos — o schema de Categorias os rejeita.
 */
export async function criarCategoriaDeTeste
(
    transaction: postgres.TransactionSql,
    categoria = 'CATEGORIA DE TESTE'
): Promise < number >
{
    const [ novaCategoria ] = await transaction < { codCategoria: number }[] >`
        INSERT INTO "Categorias"
        (
            "categoria",
            "codUser"
        )
        VALUES
        (
            ${ categoria },
            ${ COD_USER_TESTE }
        )
        RETURNING "codCategoria"
    `;

    return novaCategoria.codCategoria;
}

/**
 * Insere um produto descartável e devolve o "codProd" gerado. Não cria vínculo de
 * categoria — quem precisar do vínculo usa criarCategoriaDeTeste e a associativa.
 */
export async function criarProdutoDeTeste
(
    transaction: postgres.TransactionSql,
    produto = 'PRODUTO DE TESTE'
): Promise < number >
{
    const [ novoProduto ] = await transaction < { codProd: number }[] >`
        INSERT INTO "Produtos"
        (
            "produto",
            "undProduto",
            "pesoBruto",
            "pesoLiq",
            "precoVenda",
            "codUser"
        )
        VALUES
        (
            ${ produto },
            'UN',
            1,
            0.9,
            10,
            ${ COD_USER_TESTE }
        )
        RETURNING "codProd"
    `;

    return novoProduto.codProd;
}

export interface CompraDeTeste
{
    numero:       string;
    modelo:       string;
    serie:        string;
    codForn:      number;
    codCondDePag: number;
    codProduto:   number;
    codFormaDePag: number;
}

/**
 * Insere fornecedor → produto → compra (já lançada) com um item e
 * devolve a chave natural e os códigos gerados. Valores do item já seguem as regras de
 * cálculo da compra: 2 × 100,00 = 200,00 (o vlrTotal e o rateio são calculados na leitura, não gravados).
 */
export async function criarCompraDeTeste
(
    transaction: postgres.TransactionSql,
    chave: { numero: string; modelo?: string; serie?: string },
    codForn?: number
): Promise < CompraDeTeste >
{
    const modelo = chave.modelo ?? '55';
    const serie  = chave.serie  ?? '01';

    const codFornecedor = codForn ?? await criarFornecedorDeTeste ( transaction );

    const [ fornecedor ] = await transaction < { codCondDePag: number }[] >`
        SELECT "codCondDePag" FROM "Fornecedores" WHERE "codForn" = ${ codFornecedor }
    `;

    const codProduto = await criarProdutoDeTeste ( transaction, `PRODUTO COMPRA ${ chave.numero }` );

    await transaction`
        INSERT INTO "Compras"
        (
            "numero",
            "modelo",
            "serie",
            "codForn",
            "codCondDePag",
            "dtEmissao",
            "dtChegada",
            "dtEntrada",
            "frete",
            "seguro",
            "despesas",
            "codUser"
        )
        VALUES
        (
            ${ chave.numero },
            ${ modelo },
            ${ serie },
            ${ codFornecedor },
            ${ fornecedor.codCondDePag },
            '2026-09-01T10:00:00Z',
            '2026-09-02T10:00:00Z',
            '2026-09-02T10:00:00Z',
            5.00,
            3.00,
            2.00,
            ${ COD_USER_TESTE }
        )
    `;

    await transaction`
        INSERT INTO "CompraProduto"
        (
            "numero",
            "modelo",
            "serie",
            "codForn",
            "codProduto",
            "quantidade",
            "valorUnitario",
            "desconto",
            "unidade",
            "codUser"
        )
        VALUES
        (
            ${ chave.numero },
            ${ modelo },
            ${ serie },
            ${ codFornecedor },
            ${ codProduto },
            2,
            100.00,
            0,
            'UN',
            ${ COD_USER_TESTE }
        )
    `;

    // RN023 — uma parcela única que fecha no total da compra de teste (200,00).
    const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

    await transaction`
        INSERT INTO "CompraParcelas"
            ( "numero", "modelo", "serie", "codForn", "numParcela", "codFormaDePag", "valor", "dtVencimento", "codUser" )
        VALUES
            ( ${ chave.numero }, ${ modelo }, ${ serie }, ${ codFornecedor }, 1, ${ codFormaDePag }, 200.00,
              '2026-10-01T10:00:00Z', ${ COD_USER_TESTE } )
    `;

    return {
        numero:       chave.numero,
        modelo,
        serie,
        codForn:      codFornecedor,
        codCondDePag: fornecedor.codCondDePag,
        codProduto,
        codFormaDePag,
    };
}
