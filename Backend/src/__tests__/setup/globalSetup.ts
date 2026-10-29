import path from 'node:path';
import postgres from 'postgres';
import { runner } from 'node-pg-migrate';

// ============================================================
// Banco de testes separado — roda uma única vez, no processo principal do Vitest,
// antes de qualquer worker:
//
//   1. deriva o banco de teste (`<banco>_test`) a partir de DATABASE_URL;
//   2. descarta (se sobrou de uma execução interrompida) e recria o banco, vazio;
//   3. aplica todas as migrations (a mesma pasta de `database.config.json`);
//   4. aponta DATABASE_URL para ele — os workers herdam a variável, então o `sql` de
//      `src/lib/db.ts` conecta no banco de teste e o banco de desenvolvimento nunca é tocado.
//
// O teardown descarta o banco ao final (DROP ... WITH (FORCE) é instantâneo e limpa tudo,
// inclusive sequences — mais rápido e mais simples que TRUNCATE de todas as tabelas).
// O paralelismo entre arquivos de teste continua ligado: todos compartilham este banco.
// ============================================================

// Relativa à pasta do Backend (de onde o Vitest roda), como em `database.config.json`.
const PASTA_MIGRATIONS = path.resolve ( process.cwd(), 'src/db/migrations' );
const SUFIXO_BANCO_TESTE = '_test';

// DROP/CREATE DATABASE não aceitam parâmetro, então o nome vai interpolado — por isso é
// validado contra esta regra antes de qualquer uso.
const NOME_BANCO_VALIDO = /^[A-Za-z0-9_]+$/;

interface BancosDeConexao
{
    nomeBancoTeste: string;
    urlBancoTeste:  string;
    urlManutencao:  string;
}

function DerivarBancosDeConexao ( urlDesenvolvimento: string ): BancosDeConexao
{
    const url = new URL ( urlDesenvolvimento );

    const nomeDesenvolvimento = decodeURIComponent ( url.pathname.replace ( /^\//, '' ) );

    if ( !NOME_BANCO_VALIDO.test ( nomeDesenvolvimento ) )
    {
        throw new Error ( `Nome de banco inválido em DATABASE_URL: "${ nomeDesenvolvimento }".` );
    }

    // O sufixo é sempre acrescentado: o banco de teste nunca é o mesmo de DATABASE_URL.
    const nomeBancoTeste = `${ nomeDesenvolvimento }${ SUFIXO_BANCO_TESTE }`;

    // Trava de segurança: nunca descartar o banco apontado por DATABASE_URL.
    if ( nomeBancoTeste === nomeDesenvolvimento )
    {
        throw new Error ( `Recusando operar no banco "${ nomeBancoTeste }": ele é o próprio banco de DATABASE_URL.` );
    }

    const urlBancoTeste = new URL ( urlDesenvolvimento );
    urlBancoTeste.pathname = `/${ nomeBancoTeste }`;

    // DROP/CREATE DATABASE precisam de uma conexão com outro banco do mesmo servidor. Nem
    // toda instalação tem o banco `postgres` (o Homebrew cria só o do usuário), então a
    // conexão de manutenção usa o próprio banco de DATABASE_URL — nada é executado nele.
    return {
        nomeBancoTeste,
        urlBancoTeste: urlBancoTeste.toString(),
        urlManutencao: urlDesenvolvimento,
    };
}

async function DescartarBanco ( urlManutencao: string, nomeBanco: string ): Promise < void >
{
    const sqlManutencao = postgres ( urlManutencao, { max: 1, onnotice: () => {} } );

    try
    {
        await sqlManutencao.unsafe ( `DROP DATABASE IF EXISTS "${ nomeBanco }" WITH (FORCE)` );
    }
    finally
    {
        await sqlManutencao.end();
    }
}

async function RecriarBanco ( urlManutencao: string, nomeBanco: string ): Promise < void >
{
    const sqlManutencao = postgres ( urlManutencao, { max: 1, onnotice: () => {} } );

    try
    {
        await sqlManutencao.unsafe ( `DROP DATABASE IF EXISTS "${ nomeBanco }" WITH (FORCE)` );
        await sqlManutencao.unsafe ( `CREATE DATABASE "${ nomeBanco }"` );
    }
    finally
    {
        await sqlManutencao.end();
    }
}

export default async function setup (): Promise < () => Promise < void > >
{
    const urlDesenvolvimento = process.env.DATABASE_URL;

    if ( !urlDesenvolvimento )
    {
        throw new Error ( 'DATABASE_URL não definida: não há como derivar o banco de testes.' );
    }

    const { nomeBancoTeste, urlBancoTeste, urlManutencao } = DerivarBancosDeConexao ( urlDesenvolvimento );

    await RecriarBanco ( urlManutencao, nomeBancoTeste );

    await runner
    ({
        databaseUrl:     urlBancoTeste,
        dir:             PASTA_MIGRATIONS,
        direction:       'up',
        migrationsTable: 'pgmigrations',
        ignorePattern:   '^\\..+',
        log:             () => {},
    });

    process.env.DATABASE_URL = urlBancoTeste;

    return async () =>
    {
        await DescartarBanco ( urlManutencao, nomeBancoTeste );
    };
}
