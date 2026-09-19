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

/**
 * "Paises" tem índices únicos em "sigla" e "ddi" — um valor fixo colidiria entre
 * arquivos de teste rodando em paralelo (e com países inseridos fora de uma transação
 * revertida, como em contasPagamento.routes.test.ts). Cada chamada gera um valor novo.
 */
function gerarSiglaEDdiUnicos(): { sigla: string; ddi: string }
{
    const sufixo = Math.floor ( Math.random() * 1000 ).toString().padStart ( 3, '0' );

    return {
        sigla: `Z${ sufixo.slice ( 0, 2 ) }`,
        ddi:   sufixo,
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
            "codUser"
        )
        VALUES
        (
            ${ produto },
            'UN',
            1,
            0.9,
            ${ COD_USER_TESTE }
        )
        RETURNING "codProd"
    `;

    return novoProduto.codProd;
}
