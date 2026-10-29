import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import type postgres from 'postgres';
import withTestTransaction from '../helpers/db-helper';
import { criarCidadeDeTeste } from '../helpers/fixtures';
import { ServicosRepository } from '../../modules/servicos/servicos.repository';
import { FuncionariosRepository } from '../../modules/funcionarios/funcionarios.repository';
import { CargosRepository } from '../../modules/cargos/cargos.repository';

const repo            = new ServicosRepository();
const funcionariosRepo = new FuncionariosRepository();
const cargosRepo       = new CargosRepository();

async function CriarFuncionarioDeTeste ( transaction: postgres.TransactionSql )
{
    const codCidade = await criarCidadeDeTeste ( transaction );
    const cargo = await cargosRepo.Create ( { cargo: 'Técnico' }, 1, transaction );

    return funcionariosRepo.Create
    ( { codCidade: codCidade, codCargo: cargo.codCargo, funcionario: 'Ana Silva', funcFone: '19999999999' }, 1, transaction );
}

describe ( 'ServicosRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere com os valores enviados e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const funcionario = await CriarFuncionarioDeTeste ( transaction );

            const dados = { servico: 'Formatação', valor: '150.00', codFuncionario: funcionario.codFuncionario };

            const novo = await repo.Create ( dados, 1, transaction );

            expect ( novo.codServico ).toBeDefined();
            expect ( novo.servico ).toBe ( dados.servico );
            expect ( novo.valor ).toBe ( dados.valor );
            expect ( novo.codFuncionario ).toBe ( dados.codFuncionario );

            const achado = await repo.FindById ( novo.codServico, transaction );
            expect ( achado ).toMatchObject ( dados );
        });
    });

    it ( 'Delete faz soft delete e uma nova busca por FindById o retorna inativo', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const funcionario = await CriarFuncionarioDeTeste ( transaction );

            const novo = await repo.Create
            ( { servico: 'Para Excluir', valor: '50.00', codFuncionario: funcionario.codFuncionario }, 1, transaction );

            await repo.Delete ( novo.codServico, 1, transaction );

            const achado = await repo.FindById ( novo.codServico, transaction );
            expect ( achado?.isActive ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna false quando não há execuções de OS vinculadas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const funcionario = await CriarFuncionarioDeTeste ( transaction );

            const novo = await repo.Create
            ( { servico: 'Sem Vínculo', valor: '30.00', codFuncionario: funcionario.codFuncionario }, 1, transaction );

            const temDependentes = await repo.HasDependents ( novo.codServico, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
