import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { CondicoesPagamentoRepository } from '../../modules/condicoes-pagamento/condicoesPagamento.repository';

const repoCondicoes = new CondicoesPagamentoRepository();

describe ( 'CondicoesPagamentoRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repoCondicoes.Create
            (
                {
                    descricao:       'Teste 30/60',
                    juroCondPag:     1.5,
                    multaCondPag:    2.0,
                    descontoCondPag: 0.5,
                    parcelas:        [],
                },
                1,
                transaction
            );

            expect ( nova.codCondDePag ).toBeDefined();
            expect ( nova.descricao ).toBe ( 'Teste 30/60' );
            expect ( parseFloat ( nova.juroCondPag! ) ).toBe ( 1.5 );

            const achada = await repoCondicoes.FindById ( nova.codCondDePag, transaction );
            expect ( achada?.descricao ).toBe ( 'Teste 30/60' );
        });
    });

    it ( 'Update não altera juroCondPag, multaCondPag nem descontoCondPag (imutáveis na edição)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repoCondicoes.Create
            (
                {
                    descricao:       'Condição Original',
                    juroCondPag:     2.0,
                    multaCondPag:    3.0,
                    descontoCondPag: 1.0,
                    parcelas:        [],
                },
                1,
                transaction
            );

            const atualizada = await repoCondicoes.Update
            (
                nova.codCondDePag,
                {
                    descricao: 'Condição Editada',
                    parcelas:  [],
                    isActive:  true,
                },
                1,
                transaction
            );

            expect ( atualizada?.descricao ).toBe ( 'Condição Editada' );
            expect ( parseFloat ( atualizada!.juroCondPag! ) ).toBe ( 2.0 );
            expect ( parseFloat ( atualizada!.multaCondPag! ) ).toBe ( 3.0 );
            expect ( parseFloat ( atualizada!.descontoCondPag! ) ).toBe ( 1.0 );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repoCondicoes.Create
            (
                {
                    descricao:       'Para Excluir',
                    juroCondPag:     0,
                    multaCondPag:    0,
                    descontoCondPag: 0,
                    parcelas:        [],
                },
                1,
                transaction
            );

            await repoCondicoes.Delete ( nova.codCondDePag, 1, transaction );

            const achada = await repoCondicoes.FindById ( nova.codCondDePag, transaction );
            expect ( achada?.isActive ).toBe ( false );

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "CondicaoDePagamento" WHERE "codCondDePag" = ${ nova.codCondDePag }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });
});
