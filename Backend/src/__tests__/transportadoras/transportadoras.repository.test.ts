import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCidadeDeTeste } from '../helpers/fixtures';
import { TransportadorasRepository } from '../../modules/transportadoras/transportadoras.repository';

const repo = new TransportadorasRepository();

describe ( 'TransportadorasRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const nova = await repo.Create
            (
                {
                    codCidade,
                    transportadora: 'Expressa Logística Ltda',
                    tipoPessoa:     'JURIDICA',
                    cpfCnpjTransp:  '11111111000101',
                    inscEstTransp:  '111111111111',
                },
                1,
                transaction
            );

            expect ( nova.codTransp ).toBeDefined();
            expect ( nova.transportadora ).toBe ( 'Expressa Logística Ltda' );

            const achada = await repo.FindById ( nova.codTransp, transaction );
            expect ( achada?.transportadora ).toBe ( 'Expressa Logística Ltda' );
        });
    });

    it ( 'Update altera os dados da transportadora dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const nova = await repo.Create
            (
                {
                    codCidade,
                    transportadora: 'Transportadora Original',
                    tipoPessoa:     'JURIDICA',
                    cpfCnpjTransp:  '22222222000102',
                    inscEstTransp:  '222222222222',
                },
                1,
                transaction
            );

            const atualizada = await repo.Update
            (
                nova.codTransp,
                {
                    codCidade,
                    transportadora: 'Transportadora Atualizada',
                    tipoPessoa:     'JURIDICA',
                    cpfCnpjTransp:  '22222222000102',
                    inscEstTransp:  '222222222222',
                    isActive:       true,
                },
                1,
                transaction
            );

            expect ( atualizada?.transportadora ).toBe ( 'Transportadora Atualizada' );
            expect ( atualizada?.tipoPessoa ).toBe ( 'JURIDICA' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const nova = await repo.Create
            (
                {
                    codCidade,
                    transportadora: 'Para Excluir',
                    tipoPessoa:     'JURIDICA',
                    cpfCnpjTransp:  '33333333000103',
                    inscEstTransp:  '333333333333',
                },
                1,
                transaction
            );

            await repo.Delete ( nova.codTransp, 1, transaction );

            const achada = await repo.FindById ( nova.codTransp, transaction );
            expect ( achada ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Transportadoras" WHERE "codTransp" = ${ nova.codTransp }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna false quando não há compras ou NF-e vinculadas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const nova = await repo.Create
            (
                {
                    codCidade,
                    transportadora: 'Sem Dependentes',
                    tipoPessoa:     'JURIDICA',
                    cpfCnpjTransp:  '44444444000104',
                    inscEstTransp:  '444444444444',
                },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( nova.codTransp, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
