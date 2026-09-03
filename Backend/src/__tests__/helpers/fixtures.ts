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
 * Insere um país descartável e devolve o "codPais" gerado.
 */
export async function criarPaisDeTeste
(
    transaction: postgres.TransactionSql
): Promise < number >
{
    const [ pais ] = await transaction < { codPais: number }[] >`
        INSERT INTO "Paises"
        (
            "pais",
            "sigla",
            "codUser"
        )
        VALUES
        (
            'TESTE',
            'ZZ',
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
