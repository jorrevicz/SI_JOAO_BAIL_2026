import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarFornecedorDeTeste, criarFormaDePagamentoDeTeste } from '../helpers/fixtures';
import { ContasPagamentoRepository } from '../../modules/contas-pagamento/contasPagamento.repository';
import type { ContaAPagarId } from '../../modules/contas-pagamento/contasPagamento.repository';

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
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            const nova = await repo.Create
            (
                {
                    numero:  '000000001',
                    modelo:  '01',
                    serie:   '01',
                    parcela: 1,
                    codFornecedor,
                    codFormaDePag,
                    dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '150.00',
                    juro: '0.00',
                    desconto: '0.00',
                    multa: '0.00', valorBaixa: '100.00', dtBaixa: new Date ( '2026-01-15T00:00:00Z' ),
                } as never,
                1,
                transaction
            );

            expect ( nova.numero ).toBe ( '000000001' );
            expect ( parseFloat ( nova.valor! ) ).toBe ( 150.00 );
            expect ( parseFloat ( nova.valorBaixa ) ).toBe ( 100.00 );
            expect ( nova.justificativaCancelamento ).toBeNull();

            const achada = await repo.FindById
            (
                { numero: '000000001', modelo: '01', serie: '01', codFornecedor, parcela: 1 },
                transaction
            );

            expect ( achada?.codFornecedor ).toBe ( codFornecedor );
        });
    });

    it ( 'ExisteDocumento retorna true quando já há conta com a mesma chave (numero/modelo/serie/fornecedor/parcela)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            await repo.Create
            (
                {
                    numero:  '000009001',
                    modelo:  '01',
                    serie:   '01',
                    parcela: 1,
                    codFornecedor,
                    codFormaDePag,
                    dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00',
                    juro: '0.00',
                    desconto: '0.00',
                    multa: '0.00', valorBaixa: '100.00', dtBaixa: new Date ( '2026-01-15T00:00:00Z' ),
                } as never,
                1,
                transaction
            );

            const existe = await repo.ExisteDocumento
            (
                { numero: '000009001', modelo: '01', serie: '01', codFornecedor, parcela: 1 },
                transaction
            );

            expect ( existe ).toBe ( true );
        });
    });

    it ( 'ExisteDocumento diferencia fornecedor e parcela: o mesmo número/modelo/série com outro fornecedor ou outra parcela é inédito', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const outroFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            const id = { numero: '000009002', modelo: '01', serie: '01', codFornecedor, parcela: 1 };

            await repo.Create
            (
                { ...id, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00', valorBaixa: '100.00', dtBaixa: new Date ( '2026-01-15T00:00:00Z' ) } as never,
                1,
                transaction
            );

            expect ( await repo.ExisteDocumento ( id, transaction ) ).toBe ( true );
            expect ( await repo.ExisteDocumento ( { ...id, parcela: 2 }, transaction ) ).toBe ( false );
            expect ( await repo.ExisteDocumento ( { ...id, codFornecedor: outroFornecedor }, transaction ) ).toBe ( false );
        });
    });

    it ( 'ExisteDocumento retorna false quando não há conta com a chave informada', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const existe = await repo.ExisteDocumento
            (
                { numero: '000009999', modelo: '01', serie: '01', codFornecedor: 999999, parcela: 1 },
                transaction
            );

            expect ( existe ).toBe ( false );
        });
    });

    it ( 'Cancelar define a justificativaCancelamento dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );
            const id: ContaAPagarId = { numero: '000000004', modelo: '01', serie: '01', codFornecedor, parcela: 1 };

            await repo.Create ( { ...id, codFornecedor, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00', valorBaixa: '100.00', dtBaixa: new Date ( '2026-01-15T00:00:00Z' ) } as never, 1, transaction );

            const cancelada = await repo.Cancelar ( id, 'Compra desfeita pelo fornecedor', 1, transaction );

            expect ( cancelada!.justificativaCancelamento ).toBe ( 'Compra desfeita pelo fornecedor' );
            expect ( cancelada!.isActive ).toBe ( true );
        });
    });

    it ( 'List pagina por cursor composto (numero, modelo, serie, parcela)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codFornecedor = await criarFornecedorDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            const primeira  = { numero: '000000006', modelo: '01', serie: '01', codFornecedor, parcela: 1 };
            const segunda   = { numero: '000000007', modelo: '01', serie: '01', codFornecedor, parcela: 1 };

            await repo.Create ( { ...primeira, codFornecedor, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00', valorBaixa: '100.00', dtBaixa: new Date ( '2026-01-15T00:00:00Z' ) } as never, 1, transaction );
            await repo.Create ( { ...segunda,  codFornecedor, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00', valorBaixa: '100.00', dtBaixa: new Date ( '2026-01-15T00:00:00Z' ) } as never, 1, transaction );

            const pagina = await repo.List ( 1, primeira, transaction );

            expect ( pagina ).toHaveLength ( 1 );
            expect ( pagina[0].numero ).toBe ( segunda.numero );
        });
    });
});
