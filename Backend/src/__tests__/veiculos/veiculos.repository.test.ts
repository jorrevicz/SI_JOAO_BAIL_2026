import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { VeiculosRepository } from '../../modules/veiculos/veiculos.repository';

const repo = new VeiculosRepository();

describe ( 'VeiculosRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create
            (
                { placaVeiculo: 'TST0001', modeloVeiculo: 'Gol', marca: 'VW', codAntt: '00000001' },
                1,
                transaction
            );

            expect ( novo.codVeiculo ).toBeDefined();
            expect ( novo.placaVeiculo ).toBe ( 'TST0001' );

            const achado = await repo.FindById ( novo.codVeiculo, transaction );
            expect ( achado?.modeloVeiculo ).toBe ( 'Gol' );
        });
    });

    it ( 'Update altera os dados do veículo dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create
            (
                { placaVeiculo: 'TST0002', modeloVeiculo: 'Gol', marca: 'VW', codAntt: '00000002' },
                1,
                transaction
            );

            const atualizado = await repo.Update
            (
                novo.codVeiculo,
                { placaVeiculo: 'TST0002', modeloVeiculo: 'Gol', marca: 'Fiat', codAntt: '00000002', isActive: true },
                1,
                transaction
            );

            expect ( atualizado?.marca ).toBe ( 'Fiat' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create
            (
                { placaVeiculo: 'TST0003', modeloVeiculo: 'Gol', marca: 'VW', codAntt: '00000003' },
                1,
                transaction
            );

            await repo.Delete ( novo.codVeiculo, 1, transaction );

            const achado = await repo.FindById ( novo.codVeiculo, transaction );
            expect ( achado ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Veiculos" WHERE "codVeiculo" = ${ novo.codVeiculo }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna false quando não há transportadoras ou NF-e vinculadas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create
            (
                { placaVeiculo: 'TST0004', modeloVeiculo: 'Gol', marca: 'VW', codAntt: '00000004' },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( novo.codVeiculo, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
