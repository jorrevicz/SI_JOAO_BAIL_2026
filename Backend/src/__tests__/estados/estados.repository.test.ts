import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { EstadosRepository } from '../../modules/estados/estados.repository';

const repo = new EstadosRepository();

describe ( 'EstadosRepository (rollback)', () => {

    afterAll ( async () => { await sql.end(); } );

    it ( 'Create insere e findById recupera dentro da transação', async () => {

        await withTestTransaction ( async ( transaction ) => {

            const novo = await repo.Create
            (
                { 
                    codPais: 1, 
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

            const novo = await repo.Create
            (
                { 
                    codPais: 1, 
                    uf: 'YY', 
                    estado: 'Tmp Estado' 
                },
                1,
                transaction
            );

            await repo.Delete ( novo.codEstado, 1, transaction );

            const achado = await repo.FindById ( novo.codEstado, transaction );

            expect ( achado ).toBeNull();
        });
    });

    it ( 'List filtra por codPais dentro da transação', async () => {

        await withTestTransaction ( async ( transaction ) => {

            await repo.Create 
            ( 
                { 
                    codPais: 1, 
                    uf: 'W1', 
                    estado: 'Filtro Teste' 
                }, 1, transaction 
            );

            const lista = await repo.List ( 50, 0, 1, transaction );

            expect ( lista.every ( ( e ) => e.codPais === 1 ) ).toBe ( true );
        });
    });
});
