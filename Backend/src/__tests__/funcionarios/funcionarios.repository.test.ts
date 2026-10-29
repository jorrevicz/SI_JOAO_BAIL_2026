import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import type postgres from 'postgres';
import withTestTransaction from '../helpers/db-helper';
import { criarCidadeDeTeste } from '../helpers/fixtures';
import { FuncionariosRepository } from '../../modules/funcionarios/funcionarios.repository';
import { CargosRepository } from '../../modules/cargos/cargos.repository';

const repo        = new FuncionariosRepository();
const cargosRepo   = new CargosRepository();

async function CriarCidadeECargoDeTeste ( transaction: postgres.TransactionSql )
{
    const codCidade = await criarCidadeDeTeste ( transaction );
    const cargo = await cargosRepo.Create ( { cargo: 'Técnico' }, 1, transaction );

    return { codCidade, cargo };
}

describe ( 'FuncionariosRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere com os valores enviados e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { codCidade, cargo } = await CriarCidadeECargoDeTeste ( transaction );

            const dados = {
                codCidade:   codCidade,
                codCargo:    cargo.codCargo,
                funcionario: 'Ana Silva',
                funcFone:    '19999999999',
            };

            const novo = await repo.Create ( dados, 1, transaction );

            expect ( novo.codFuncionario ).toBeDefined();
            expect ( novo.codCidade ).toBe ( dados.codCidade );
            expect ( novo.codCargo ).toBe ( dados.codCargo );
            expect ( novo.funcionario ).toBe ( dados.funcionario );
            expect ( novo.funcFone ).toBe ( dados.funcFone );

            const achado = await repo.FindById ( novo.codFuncionario, transaction );
            expect ( achado ).toMatchObject ( dados );
        });
    });

    it ( 'Delete faz soft delete e uma nova busca por FindById o retorna inativo', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { codCidade, cargo } = await CriarCidadeECargoDeTeste ( transaction );

            const novo = await repo.Create
            (
                { codCidade: codCidade, codCargo: cargo.codCargo, funcionario: 'Para Excluir', funcFone: '19988887777' },
                1,
                transaction
            );

            await repo.Delete ( novo.codFuncionario, 1, transaction );

            const achado = await repo.FindById ( novo.codFuncionario, transaction );
            expect ( achado?.isActive ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna false quando não há serviços vinculados', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { codCidade, cargo } = await CriarCidadeECargoDeTeste ( transaction );

            const novo = await repo.Create
            (
                { codCidade: codCidade, codCargo: cargo.codCargo, funcionario: 'Sem Vínculo', funcFone: '19977776666' },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( novo.codFuncionario, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
