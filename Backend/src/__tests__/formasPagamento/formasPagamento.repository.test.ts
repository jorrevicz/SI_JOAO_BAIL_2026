import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { FormasPagamentoRepository } from '../../modules/formas-pagamento/formasPagamento.repository';

const repoFormas = new FormasPagamentoRepository();

describe ( 'FormasPagamentoRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repoFormas.Create
            (
                { formaDePag: 'Boleto Teste', prazoCompensacao: 3 },
                1,
                transaction
            );

            expect ( nova.codFormaDePag ).toBeDefined();
            expect ( nova.prazoCompensacao ).toBe ( 3 );

            const achada = await repoFormas.FindById ( nova.codFormaDePag, transaction );
            expect ( achada?.formaDePag ).toBe ( 'Boleto Teste' );
        });
    });

    it ( 'Update não altera prazoCompensacao (imutável na edição)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repoFormas.Create
            (
                { formaDePag: 'Cartão Original', prazoCompensacao: 5 },
                1,
                transaction
            );

            const atualizada = await repoFormas.Update
            (
                nova.codFormaDePag,
                { formaDePag: 'Cartão Editado', isActive: true },
                1,
                transaction
            );

            expect ( atualizada?.formaDePag ).toBe ( 'Cartão Editado' );
            expect ( atualizada?.prazoCompensacao ).toBe ( 5 );
        });
    });
});
