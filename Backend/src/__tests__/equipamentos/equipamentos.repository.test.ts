import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { EquipamentosRepository } from '../../modules/equipamentos/equipamentos.repository';

const repo = new EquipamentosRepository();

describe ( 'EquipamentosRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere com os valores enviados e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const equipamento = await repo.Create
            (
                {
                    equipamento: 'Notebook Dell', soEq: 'Win11', socketEq: 'BGA', memoriaRam: '8GB',
                    tipoOffice: '2021', placaMae: 'Dell', bios: '1.2.0', capacidadeRam: '8GB',
                    possuiSSD: true, possuiHD: false, capacidadeArmz: '256GB', usoArmz: '50%',
                },
                1,
                transaction
            );

            expect ( equipamento.equipamento ).toBe ( 'Notebook Dell' );
            expect ( equipamento.possuiSSD ).toBe ( true );

            const encontrado = await repo.FindById ( equipamento.codEquipamento, transaction );

            expect ( encontrado ).toMatchObject ( { codEquipamento: equipamento.codEquipamento, equipamento: 'Notebook Dell' } );
        });
    });

    it ( 'Create aceita grupoUser opcional como nulo', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const equipamento = await repo.Create
            (
                {
                    equipamento: 'Desktop Genérico', soEq: 'Win10', socketEq: 'LGA1200', memoriaRam: '16GB',
                    tipoOffice: '2019', placaMae: 'Asus', bios: '2.0.1', capacidadeRam: '16GB',
                    possuiSSD: false, possuiHD: true, capacidadeArmz: '1TB', usoArmz: '80%',
                },
                1,
                transaction
            );

            expect ( equipamento.grupoUser ).toBeNull();
        });
    });

    it ( 'FindById devolve null para código inexistente', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            expect ( await repo.FindById ( 999999, transaction ) ).toBeNull();
        });
    });

    it ( 'Update altera a ficha existente e devolve o registro atualizado', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const fichaBase =
            {
                equipamento: 'Notebook Dell', soEq: 'Win11', socketEq: 'BGA', memoriaRam: '8GB',
                tipoOffice: '2021', placaMae: 'Dell', bios: '1.2.0', capacidadeRam: '8GB',
                possuiSSD: true, possuiHD: false, capacidadeArmz: '256GB', usoArmz: '50%',
            };
            const criado = await repo.Create ( fichaBase, 1, transaction );

            const atualizado = await repo.Update
            (
                criado.codEquipamento,
                { ...fichaBase, memoriaRam: '16GB', capacidadeRam: '16GB', grupoUser: 'Rede' },
                1,
                transaction
            );

            expect ( atualizado ).toMatchObject
            ({
                codEquipamento: criado.codEquipamento, memoriaRam: '16GB', capacidadeRam: '16GB', grupoUser: 'Rede',
            });
        });
    });

    it ( 'Update devolve null para código inexistente', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const resultado = await repo.Update
            (
                999999,
                {
                    equipamento: 'Notebook Dell', soEq: 'Win11', socketEq: 'BGA', memoriaRam: '8GB',
                    tipoOffice: '2021', placaMae: 'Dell', bios: '1.2.0', capacidadeRam: '8GB',
                    possuiSSD: true, possuiHD: false, capacidadeArmz: '256GB', usoArmz: '50%',
                },
                1,
                transaction
            );

            expect ( resultado ).toBeNull();
        });
    });
});
