import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarClienteDeTeste, criarFormaDePagamentoDeTeste } from '../helpers/fixtures';
import { ContasReceberRepository } from '../../modules/contas-receber/contasReceber.repository';
import type { ContaAReceberId } from '../../modules/contas-receber/contasReceber.repository';

const repo = new ContasReceberRepository();

describe ( 'ContasReceberRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCliente    = await criarClienteDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            const nova = await repo.Create
            (
                {
                    numero:  '00000001',
                    modelo:  '01',
                    serie:   '01',
                    parcela: 1,
                    codCliente,
                    codFormaDePag,
                    dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '150.00',
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
            expect ( nova.dtPagamento ).toBeNull();
            expect ( nova.justificativaCancelamento ).toBeNull();

            const achada = await repo.FindById
            (
                { numero: '00000001', modelo: '01', serie: '01', parcela: 1 },
                transaction
            );

            expect ( achada?.codCliente ).toBe ( codCliente );
        });
    });

    it ( 'ExisteDocumento retorna true quando já há conta com o mesmo numero/modelo/serie', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCliente    = await criarClienteDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            await repo.Create
            (
                {
                    numero:  '00009001',
                    modelo:  '01',
                    serie:   '01',
                    parcela: 1,
                    codCliente,
                    codFormaDePag,
                    dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00',
                    juro: '0.00',
                    desconto: '0.00',
                    multa: '0.00',
                } as never,
                1,
                transaction
            );

            const existe = await repo.ExisteDocumento
            (
                { numero: '00009001', modelo: '01', serie: '01' },
                transaction
            );

            expect ( existe ).toBe ( true );
        });
    });

    it ( 'ExisteDocumento retorna false quando não há conta com o numero/modelo/serie informados', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const existe = await repo.ExisteDocumento
            (
                { numero: '00009999', modelo: '01', serie: '01' },
                transaction
            );

            expect ( existe ).toBe ( false );
        });
    });

    it ( 'Update altera os campos mutáveis dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCliente     = await criarClienteDeTeste ( transaction );
            const codFormaDePag  = await criarFormaDePagamentoDeTeste ( transaction );
            const outraForma     = await criarFormaDePagamentoDeTeste ( transaction );

            const id: ContaAReceberId = { numero: '00000002', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create
            (
                { ...id, codCliente, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never,
                1,
                transaction
            );

            const atualizada = await repo.Update
            (
                id,
                { codCliente, codFormaDePag: outraForma, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00', isActive: true } as never,
                1,
                transaction
            );

            expect ( parseFloat ( atualizada!.valor! ) ).toBe ( 200.00 );
            expect ( atualizada!.codFormaDePag ).toBe ( outraForma );
        });
    });

    it ( 'RegistrarPagamentoRecebido define valorBaixa, dtBaixa e dtPagamento dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCliente    = await criarClienteDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );
            const id: ContaAReceberId = { numero: '00000003', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create ( { ...id, codCliente, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );

            const dtBaixa = new Date ( '2026-01-15T00:00:00Z' );
            const dtPagamento = new Date ( '2026-01-15T00:00:00Z' );
            const baixada = await repo.RegistrarPagamentoRecebido ( id, '100.00', dtBaixa, dtPagamento, 1, transaction );

            expect ( parseFloat ( baixada!.valorBaixa! ) ).toBe ( 100.00 );
            expect ( baixada!.dtBaixa ).toEqual ( dtBaixa );
            expect ( baixada!.dtPagamento ).toEqual ( dtPagamento );
        });
    });

    it ( 'Cancelar define a justificativaCancelamento dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCliente    = await criarClienteDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );
            const id: ContaAReceberId = { numero: '00000004', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create ( { ...id, codCliente, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );

            const cancelada = await repo.Cancelar ( id, 'Venda desfeita pelo cliente', 1, transaction );

            expect ( cancelada!.justificativaCancelamento ).toBe ( 'Venda desfeita pelo cliente' );
            expect ( cancelada!.isActive ).toBe ( true );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCliente    = await criarClienteDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );
            const id: ContaAReceberId = { numero: '00000005', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create ( { ...id, codCliente, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );
            await repo.Delete ( id, 1, transaction );

            const achada = await repo.FindById ( id, transaction );
            expect ( achada ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "ContasAReceber"
                WHERE "numero" = ${ id.numero } AND "modelo" = ${ id.modelo }
                AND   "serie"  = ${ id.serie }  AND "parcela" = ${ id.parcela }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'List pagina por cursor composto (numero, modelo, serie, parcela)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCliente    = await criarClienteDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            const primeira = { numero: '00000006', modelo: '01', serie: '01', parcela: 1 };
            const segunda  = { numero: '00000007', modelo: '01', serie: '01', parcela: 1 };

            await repo.Create ( { ...primeira, codCliente, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );
            await repo.Create ( { ...segunda,  codCliente, codFormaDePag, dtEmissao: new Date ( '2026-01-01' ), dtVencimento: new Date ( '2026-01-10' ), valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00' } as never, 1, transaction );

            const pagina = await repo.List ( 1, primeira, transaction );

            expect ( pagina ).toHaveLength ( 1 );
            expect ( pagina[0].numero ).toBe ( segunda.numero );
        });
    });
});
