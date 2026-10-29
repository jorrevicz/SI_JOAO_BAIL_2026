import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarEstadoDeTeste } from '../helpers/fixtures';
import { CidadesRepository } from '../../modules/cidades/cidades.repository';

const repo = new CidadesRepository();

describe ( 'CidadesRepository (rollback)', () => {

    afterAll ( async () => { await sql.end(); } );

    it ( 'Create insere e findById recupera dentro da transação', async () => {

        await withTestTransaction ( async ( transaction ) => {

            const codEstado = await criarEstadoDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codEstado,
                    cidade: 'Cidade Teste',
                    ddd: '11'
                },
                1,
                transaction
            );

            expect ( novo.codCidade ).toBeDefined();

            const achado = await repo.FindById ( novo.codCidade, transaction );

            expect ( achado?.cidade ).toBe ( 'Cidade Teste' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () => {

        await withTestTransaction ( async ( transaction ) => {

            const codEstado = await criarEstadoDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codEstado,
                    cidade: 'Tmp Cidade',
                    ddd: '11'
                }, 1, transaction
            );

            await repo.Delete ( novo.codCidade, 1, transaction );

            const achado = await repo.FindById ( novo.codCidade, transaction );

            expect ( achado?.isActive ).toBe ( false );

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Cidades" WHERE "codCidade" = ${ novo.codCidade }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'List filtra por codEstado dentro da transação', async () => {

        await withTestTransaction ( async ( transaction ) => {

            const codEstado = await criarEstadoDeTeste ( transaction );

            await repo.Create
            (
                {
                    codEstado,
                    cidade: 'Filtro Cidade',
                    ddd: '11'
                }, 1, transaction
            );

            const lista = await repo.List ( 50, 0, codEstado, transaction );

            expect
            (
                lista.every ( ( c ) => c.codEstado === codEstado )
            ).toBe ( true );
        });
    });
});
