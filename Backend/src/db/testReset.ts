import 'dotenv/config';
import sql from '../lib/db';

// Esvazia o banco de dev por completo antes da suíte de testes: nenhum teste de rota
// deve depender de dados que sobraram de uma execução anterior 
// Cada teste passa a ser responsável por criar as próprias
// dependências, como já fazem funcionarios/servicos/contasPagamento/contasReceber.
//
// Roda via `pretest` (ver package.json) — depois de `npm test`, repovoe o banco de dev
// com `npm run seed`.
async function TruncarBancoDeTeste (): Promise < void >
{
    const tabelas = await sql < { tablename: string }[] >`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename <> 'pgmigrations'
    `;

    if ( tabelas.length === 0 )
    {
        return;
    }

    // Os nomes de tabela vêm do catálogo do Postgres (pg_tables), nunca de entrada
    // externa — não há valor de usuário para escapar aqui. sql.unsafe é usado só porque
    // o driver não parametriza identificadores de um TRUNCATE com lista dinâmica.
    const identificadores = tabelas
        .map ( ( { tablename } ) => `"${ tablename }"` )
        .join ( ', ' );

    await sql.unsafe ( `TRUNCATE TABLE ${ identificadores } RESTART IDENTITY CASCADE` );
}

TruncarBancoDeTeste()
    .then ( async () =>
    {
        console.log ( 'Banco de teste esvaziado (rode `npm run seed` para repovoar o ambiente de dev).' );
        await sql.end();
    })
    .catch ( async ( err ) =>
    {
        console.error ( 'Falha ao esvaziar o banco de teste:', err );
        await sql.end();
        process.exit ( 1 );
    });
