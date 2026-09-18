import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarFornecedorDeTeste, criarFormaDePagamentoDeTeste } from '../helpers/fixtures';
import { ContasPagamentoRepository } from '../../modules/contas-pagamento/contas-pagamento.repository';
import type { ContaAPagarId } from '../../modules/contas-pagamento/contas-pagamento.repository';

const repo = new ContasPagamentoRepository();

describe ( 'ContasPagamentoRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDepag = await criarFormaDePagamentoDeTeste ( transaction );

            const nova = await repo.Create
            (
                {
                    numero:  '00000001',
                    modelo:  '01',
                    serie:   '01',
                    parcela: 1,
                    codFornecedor,
                    codFormaDepag,
                    valor: '150.00',
                    juro: '0.00',
                    desconto: '0.00',
                    multa: '0.00',
                } as never,
                1,
                transaction
            );

            expect ( nova.numero ).toBe ( '00000001' );
            expect ( parseFloat ( nova.valor! ) ).toBe ( 150.00 );
            expect ( nova.valorBaixa ).toBeNull();
            expect ( nova.justificativaCancelamento ).toBeNull();

            const achada = await repo.FindById
            (
                { numero: '00000001', modelo: '01', serie: '01', parcela: 1 },
                transaction
            );

            expect ( achada?.codFornecedor ).toBe ( codFornecedor );
        });
    });

    it ( 'Update altera os campos mutáveis dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDepag = await criarFormaDePagamentoDeTeste ( transaction );
            const outraForma    = await criarFormaDePagamentoDeTeste ( transaction );

            const id: ContaAPagarId = { numero: '00000002', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create
            (
                { ...id, codFornecedor, codFormaDepag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never,
                1,
                transaction
            );

            const atualizada = await repo.Update
            (
                id,
                { codFornecedor, codFormaDepag: outraForma, valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00', isActive: true } as never,
                1,
                transaction
            );

            expect ( parseFloat ( atualizada!.valor! ) ).toBe ( 200.00 );
            expect ( atualizada!.codFormaDePag ).toBe ( outraForma );
        });
    });

    it ( 'RegistrarBaixa define valorBaixa e dtBaixa dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDepag = await criarFormaDePagamentoDeTeste ( transaction );
            const id: ContaAPagarId = { numero: '00000003', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create ( { ...id, codFornecedor, codFormaDepag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );

            const dtBaixa = new Date ( '2026-01-15T00:00:00Z' );
            const baixada = await repo.RegistrarBaixa ( id, '100.00', dtBaixa, 1, transaction );

            expect ( parseFloat ( baixada!.valorBaixa! ) ).toBe ( 100.00 );
            expect ( baixada!.dtBaixa ).toEqual ( dtBaixa );
        });
    });

    it ( 'Cancelar define a justificativaCancelamento dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDepag = await criarFormaDePagamentoDeTeste ( transaction );
            const id: ContaAPagarId = { numero: '00000004', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create ( { ...id, codFornecedor, codFormaDepag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );

            const cancelada = await repo.Cancelar ( id, 'Compra desfeita pelo fornecedor', 1, transaction );

            expect ( cancelada!.justificativaCancelamento ).toBe ( 'Compra desfeita pelo fornecedor' );
            expect ( cancelada!.isActive ).toBe ( true );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDepag = await criarFormaDePagamentoDeTeste ( transaction );
            const id: ContaAPagarId = { numero: '00000005', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create ( { ...id, codFornecedor, codFormaDepag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );
            await repo.Delete ( id, 1, transaction );

            const achada = await repo.FindById ( id, transaction );
            expect ( achada ).toBeNull();
        });
    });

    it ( 'List pagina por cursor composto (numero, modelo, serie, parcela)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDepag = await criarFormaDePagamentoDeTeste ( transaction );

            const primeira  = { numero: '00000006', modelo: '01', serie: '01', parcela: 1 };
            const segunda   = { numero: '00000007', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create ( { ...primeira, codFornecedor, codFormaDepag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );
            await repo.Create ( { ...segunda,  codFornecedor, codFormaDepag, valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );

            const pagina = await repo.List ( 1, primeira, transaction );

            expect ( pagina ).toHaveLength ( 1 );
            expect ( pagina[0].numero ).toBe ( segunda.numero );
        });
    });
});
