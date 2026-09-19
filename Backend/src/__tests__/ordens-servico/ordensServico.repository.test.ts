import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { OrdensServicoRepository } from '../../modules/ordens-servico/ordensServico.repository';
import { AparelhosRepository } from '../../modules/aparelhos/aparelhos.repository';
import { EquipamentosRepository } from '../../modules/equipamentos/equipamentos.repository';
import { ClientesRepository } from '../../modules/clientes/clientes.repository';
import { PaisesRepository } from '../../modules/paises/paises.repository';
import { EstadosRepository } from '../../modules/estados/estados.repository';
import { CidadesRepository } from '../../modules/cidades/cidades.repository';
import { CondicoesPagamentoRepository } from '../../modules/condicoes-pagamento/condicoesPagamento.repository';

const repo             = new OrdensServicoRepository();
const aparelhosRepo    = new AparelhosRepository();
const equipamentosRepo = new EquipamentosRepository();
const clientesRepo     = new ClientesRepository();
const paisesRepo       = new PaisesRepository();
const estadosRepo      = new EstadosRepository();
const cidadesRepo      = new CidadesRepository();
const condicoesRepo    = new CondicoesPagamentoRepository();

async function CriarClienteDeTeste ( transaction: Parameters < typeof clientesRepo.Create >[ 2 ] )
{
    const pais = await paisesRepo.Create
    ( { pais: 'Brasil', sigla: 'BR', ddi: `${ Date.now() % 1000 }`, moeda: 'BRL' }, 1, transaction );
    const estado = await estadosRepo.Create
    ( { codPais: pais.codPais, uf: 'SP', estado: 'São Paulo' }, 1, transaction );
    const cidade = await cidadesRepo.Create
    ( { codEstado: estado.codEstado, cidade: 'Campinas', ddd: '19' }, 1, transaction );
    const condicao = await condicoesRepo.Create
    ( { descricao: 'À Vista', juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0, parcelas: [] }, 1, transaction );

    return clientesRepo.Create
    (
        {
            tipoPessoa: 'FISICA',
            cliente: 'Cliente Teste',
            codCidade: cidade.codCidade,
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

    it ( 'Create insere a OS referenciando Aparelho e Equipamento recém-criados', async () =>
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

            const os = await repo.Create
            (
                {
                    numOdS: 'OS000001', codCliente: cliente.codCliente, atendente: 'Ana',
                    defeito: 'Não liga', tipoOdS: 'Garantia',
                    codAparelho: aparelho.codAparelho, codEquipamento: equipamento.codEquipamento,
                },
                1,
                transaction
            );

            expect ( os.numOdS ).toBe ( 'OS000001' );

            const achada = await repo.FindById ( 'OS000001', transaction );
            expect ( achada?.defeito ).toBe ( 'Não liga' );
            expect ( achada?.dtAtendimento ).toBeNull();
        });
    });

    it ( 'RegistrarDiagnostico preenche dtAtendimento na primeira chamada', async () =>
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
            await repo.Create
            (
                {
                    numOdS: 'OS000002', codCliente: cliente.codCliente, atendente: 'Ana',
                    defeito: 'Não liga', tipoOdS: 'Garantia',
                    codAparelho: aparelho.codAparelho, codEquipamento: equipamento.codEquipamento,
                },
                1,
                transaction
            );

            const diagnosticada = await repo.RegistrarDiagnostico
            ( 'OS000002', { obsTecnica: 'Placa-mãe queimada' }, 1, transaction );

            expect ( diagnosticada?.obsTecnica ).toBe ( 'Placa-mãe queimada' );
            expect ( diagnosticada?.dtAtendimento ).not.toBeNull();
        });
    });
});
