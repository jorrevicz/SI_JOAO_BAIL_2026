import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import type postgres from 'postgres';
import withTestTransaction from '../helpers/db-helper';
import { criarCidadeDeTeste } from '../helpers/fixtures';
import { OrdensServicoRepository } from '../../modules/ordens-servico/ordensServico.repository';
import { AparelhosRepository } from '../../modules/aparelhos/aparelhos.repository';
import { EquipamentosRepository } from '../../modules/equipamentos/equipamentos.repository';
import { ClientesRepository } from '../../modules/clientes/clientes.repository';
import { CondicoesPagamentoRepository } from '../../modules/condicoes-pagamento/condicoesPagamento.repository';

const repo             = new OrdensServicoRepository();
const aparelhosRepo    = new AparelhosRepository();
const equipamentosRepo = new EquipamentosRepository();
const clientesRepo     = new ClientesRepository();
const condicoesRepo    = new CondicoesPagamentoRepository();

async function CriarClienteDeTeste ( transaction: postgres.TransactionSql )
{
    const codCidade = await criarCidadeDeTeste ( transaction );
    const condicao = await condicoesRepo.Create
    ( { descricao: 'À Vista', juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0, parcelas: [] }, 1, transaction );

    return clientesRepo.Create
    (
        {
            tipoPessoa: 'FISICA',
            cliente: 'Cliente Teste',
            codCidade: codCidade,
            codCondDePag: condicao.codCondDePag,
            enderecoCl: 'Rua X',
            bairroCl: 'Centro',
            cepCl: '13000000',
            foneCl: '19999999999',
        } as never,
        1,
        transaction
    );
}

describe ( 'OrdensServicoRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere a OS referenciando o Aparelho recém-criado, sem Equipamento', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const cliente = await CriarClienteDeTeste ( transaction );

            const aparelho = await aparelhosRepo.Create
            ( { modelo: 'Inspiron 15', voltagem: 'Bivolt', garantia: '12 meses' }, 1, transaction );

            const os = await repo.Create
            (
                {
                    codCliente: cliente.codCliente, atendente: 'Ana',
                    defeito: 'Não liga', tipoOdS: 'Garantia',
                    codAparelho: aparelho.codAparelho,
                },
                1,
                transaction
            );

            expect ( os.numOdS ).toBeTruthy();

            const achada = await repo.FindById ( os.numOdS, transaction );
            expect ( achada?.defeito ).toBe ( 'Não liga' );
            expect ( achada?.dtAtendimento ).toBeNull();
            expect ( achada?.codEquipamento ).toBeNull();
        });
    });

    it ( 'VincularEquipamento associa a ficha de Equipamento a uma OS já aberta', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const cliente = await CriarClienteDeTeste ( transaction );
            const aparelho = await aparelhosRepo.Create
            ( { modelo: 'Inspiron 15', voltagem: 'Bivolt', garantia: '12 meses' }, 1, transaction );
            const equipamento = await equipamentosRepo.Create
            (
                {
                    equipamento: 'Notebook Dell', soEq: 'Win11', socketEq: 'BGA', memoriaRam: '8GB',
                    tipoOffice: '2021', placaMae: 'Dell', bios: '1.2.0', capacidadeRam: '8GB',
                    possuiSSD: true, possuiHD: false, capacidadeArmz: '256GB', usoArmz: '50%',
                },
                1,
                transaction
            );
            const criada = await repo.Create
            (
                {
                    codCliente: cliente.codCliente, atendente: 'Ana',
                    defeito: 'Não liga', tipoOdS: 'Garantia',
                    codAparelho: aparelho.codAparelho,
                },
                1,
                transaction
            );

            const vinculada = await repo.VincularEquipamento
            ( criada.numOdS, equipamento.codEquipamento, 1, transaction );

            expect ( vinculada?.codEquipamento ).toBe ( equipamento.codEquipamento );
        });
    });

    it ( 'RegistrarDiagnostico preenche dtAtendimento na primeira chamada', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const cliente = await CriarClienteDeTeste ( transaction );
            const aparelho = await aparelhosRepo.Create
            ( { modelo: 'Inspiron 15', voltagem: 'Bivolt', garantia: '12 meses' }, 1, transaction );
            const criada = await repo.Create
            (
                {
                    codCliente: cliente.codCliente, atendente: 'Ana',
                    defeito: 'Não liga', tipoOdS: 'Garantia',
                    codAparelho: aparelho.codAparelho,
                },
                1,
                transaction
            );

            const diagnosticada = await repo.RegistrarDiagnostico
            ( criada.numOdS, { historicoManutencao: 'Já trocou a bateria antes' }, 1, transaction );

            expect ( diagnosticada?.historicoManutencao ).toBe ( 'Já trocou a bateria antes' );
            expect ( diagnosticada?.dtAtendimento ).not.toBeNull();
        });
    });

    it ( 'AtualizarObsTecnica atualiza a observação técnica sem alterar dtAtendimento', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const cliente = await CriarClienteDeTeste ( transaction );
            const aparelho = await aparelhosRepo.Create
            ( { modelo: 'Inspiron 15', voltagem: 'Bivolt', garantia: '12 meses' }, 1, transaction );
            const criada = await repo.Create
            (
                {
                    codCliente: cliente.codCliente, atendente: 'Ana',
                    defeito: 'Não liga', tipoOdS: 'Garantia',
                    codAparelho: aparelho.codAparelho,
                },
                1,
                transaction
            );

            const atualizada = await repo.AtualizarObsTecnica
            ( criada.numOdS, 'Placa-mãe trocada', 1, transaction );

            expect ( atualizada?.obsTecnica ).toBe ( 'Placa-mãe trocada' );
            expect ( atualizada?.dtAtendimento ).toBeNull();
        });
    });

    it ( 'Delete faz soft delete da OS e não desativa duas vezes', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const cliente = await CriarClienteDeTeste ( transaction );
            const aparelho = await aparelhosRepo.Create
            ( { modelo: 'Inspiron 15', voltagem: 'Bivolt', garantia: '12 meses' }, 1, transaction );
            const criada = await repo.Create
            (
                {
                    codCliente: cliente.codCliente, atendente: 'Ana',
                    defeito: 'Não liga', tipoOdS: 'Garantia',
                    codAparelho: aparelho.codAparelho,
                },
                1,
                transaction
            );

            const removida = await repo.Delete ( criada.numOdS, 1, transaction );
            expect ( removida?.numOdS ).toBe ( criada.numOdS );

            const achada = await repo.FindById ( criada.numOdS, transaction );
            expect ( achada?.isActive ).toBe ( false );

            expect ( await repo.Delete ( criada.numOdS, 1, transaction ) ).toBeNull();
        });
    });
});
