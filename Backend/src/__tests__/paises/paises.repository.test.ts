import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { PaisesRepository } from '../../modules/paises/paises.repository';

const repo = new PaisesRepository();

describe ( 'PaisesRepository (rollback)', () => {
    afterAll
    (
        async () => { 
            await sql.end(); 
        }
    );

    it ( 'create insere e findById recupera dentro da transação', async () => {
        await withTestTransaction 
        ( 
            async ( transaction ) => {
                const novo = await repo.Create 
                ( 
                    { 
                        pais: 'Teste', 
                        sigla: 'TS', 
                        ddi: '+00', 
                        moeda: 'TST' 
                    }, 
                    1, 
                    transaction 
                );
                expect ( novo.codPais ).toBeDefined();
                
                const achado = await repo.FindById ( novo.codPais, transaction );
                expect ( achado?.sigla ).toBe( 'TS' );
            }
        );
    });

    it ( 'remove faz soft delete (isActive=false) dentro da transação', async () => {
        await withTestTransaction
        (   
            async ( transaction ) => {
                const novo = await repo.Create 
                ( 
                    { 
                        pais: 'Tmp', 
                        sigla: 'TZ'
                    }, 
                    1, 
                    transaction
                );
                await repo.Delete ( novo.codPais, 1, transaction );

                const achado = await repo.FindById ( novo.codPais, transaction );
                expect ( achado ).toBeNull();
            }
        );
    });
});