import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { FuncionariosRepository } from '../../modules/funcionarios/funcionarios.repository';
import { CargosRepository } from '../../modules/cargos/cargos.repository';
import { PaisesRepository } from '../../modules/paises/paises.repository';
import { EstadosRepository } from '../../modules/estados/estados.repository';
import { CidadesRepository } from '../../modules/cidades/cidades.repository';

const repo        = new FuncionariosRepository();
const cargosRepo   = new CargosRepository();
const paisesRepo   = new PaisesRepository();
const estadosRepo  = new EstadosRepository();
const cidadesRepo  = new CidadesRepository();

async function CriarCidadeECargoDeTeste ( transaction: Parameters < typeof cidadesRepo.Create >[ 2 ] )
{
    const pais = await paisesRepo.Create
    ( { pais: 'Brasil', sigla: 'BR', ddi: `${ Date.now() % 1000 }`, moeda: 'BRL' }, 1, transaction );
    const estado = await estadosRepo.Create
    ( { codPais: pais.codPais, uf: 'SP', estado: 'São Paulo' }, 1, transaction );
    const cidade = await cidadesRepo.Create
    ( { codEstado: estado.codEstado, cidade: 'Campinas', ddd: '19' }, 1, transaction );
    const cargo = await cargosRepo.Create ( { cargo: 'Técnico' }, 1, transaction );

    return { cidade, cargo };
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
            const { cidade, cargo } = await CriarCidadeECargoDeTeste ( transaction );

            const dados = {
                codCidade:   cidade.codCidade,
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

    it ( 'Delete faz soft delete e uma nova busca por FindById retorna null', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { cidade, cargo } = await CriarCidadeECargoDeTeste ( transaction );

            const novo = await repo.Create
            (
                { codCidade: cidade.codCidade, codCargo: cargo.codCargo, funcionario: 'Para Excluir', funcFone: '19988887777' },
                1,
                transaction
            );

            await repo.Delete ( novo.codFuncionario, 1, transaction );

            const achado = await repo.FindById ( novo.codFuncionario, transaction );
            expect ( achado ).toBeNull();
        });
    });

    it ( 'HasDependents retorna false quando não há serviços vinculados', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { cidade, cargo } = await CriarCidadeECargoDeTeste ( transaction );

            const novo = await repo.Create
            (
                { codCidade: cidade.codCidade, codCargo: cargo.codCargo, funcionario: 'Sem Vínculo', funcFone: '19977776666' },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( novo.codFuncionario, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
