import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarFornecedorDeTeste } from '../helpers/fixtures';
import { FormasPagamentoRepository } from '../../modules/formas-pagamento/formasPagamento.repository';
import { ContasPagamentoRepository } from '../../modules/contas-pagamento/contasPagamento.repository';

const repoFormas = new FormasPagamentoRepository();
const repoContasPagar = new ContasPagamentoRepository();

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

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repoFormas.Create
            (
                { formaDePag: 'Para Excluir', prazoCompensacao: 0 },
                1,
                transaction
            );

            await repoFormas.Delete ( nova.codFormaDePag, 1, transaction );

            const achada = await repoFormas.FindById ( nova.codFormaDePag, transaction );
            expect ( achada ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "FormaDePagamento" WHERE "codFormaDePag" = ${ nova.codFormaDePag }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna false quando não há dependentes', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repoFormas.Create
            (
                { formaDePag: 'Sem Dependentes', prazoCompensacao: 0 },
                1,
                transaction
            );

            const temDependentes = await repoFormas.HasDependents ( nova.codFormaDePag, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna true quando há uma conta a pagar vinculada', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repoFormas.Create
            (
                { formaDePag: 'Usada em Conta a Pagar', prazoCompensacao: 0 },
                1,
                transaction
            );

            const codFornecedor = await criarFornecedorDeTeste ( transaction );

            await repoContasPagar.Create
            (
                {
                    numero:  '00000009',
                    modelo:  '01',
                    serie:   '01',
                    parcela: 1,
                    codFornecedor,
                    codFormaDePag: nova.codFormaDePag,
                    dtEmissao: new Date ( '2026-01-01' ),
                    dtVencimento: new Date ( '2026-01-10' ),
                    valor: '100.00',
                    juro: '0.00',
                    desconto: '0.00',
                    multa: '0.00',
                    valorBaixa: '100.00',
                    dtBaixa: new Date ( '2026-01-15T00:00:00Z' ),
                } as never,
                1,
                transaction
            );

            const temDependentes = await repoFormas.HasDependents ( nova.codFormaDePag, transaction );
            expect ( temDependentes ).toBe ( true );
        });
    });
});
