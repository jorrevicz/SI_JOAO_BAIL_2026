import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarPaisDeTeste } from '../helpers/fixtures';
import { EstadosRepository } from '../../modules/estados/estados.repository';

const repo = new EstadosRepository();

describe ( 'EstadosRepository (rollback)', () => {

    afterAll ( async () => { await sql.end(); } );

    it ( 'Create insere e findById recupera dentro da transação', async () => {

        await withTestTransaction ( async ( transaction ) => {

            const codPais = await criarPaisDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codPais,
                    uf: 'ZZ',
                    estado: 'Estado Teste'
                },
                1,
                transaction
            );

            expect ( novo.codEstado ).toBeDefined();

            const achado = await repo.FindById ( novo.codEstado, transaction );

            expect ( achado?.uf ).toBe ( 'ZZ' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () => {

        await withTestTransaction ( async ( transaction ) => {

            const codPais = await criarPaisDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codPais,
                    uf: 'YY',
                    estado: 'Tmp Estado'
                },
                1,
                transaction
            );

            await repo.Delete ( novo.codEstado, 1, transaction );

            const achado = await repo.FindById ( novo.codEstado, transaction );

            expect ( achado ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Estados" WHERE "codEstado" = ${ novo.codEstado }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'List filtra por codPais dentro da transação', async () => {

        await withTestTransaction ( async ( transaction ) => {

            const codPais = await criarPaisDeTeste ( transaction );

            await repo.Create
            (
                {
                    codPais,
                    uf: 'W1',
                    estado: 'Filtro Teste'
                }, 1, transaction
            );

            const lista = await repo.List ( 50, 0, codPais, transaction );

            expect ( lista.every ( ( e ) => e.codPais === codPais ) ).toBe ( true );
        });
    });
});
