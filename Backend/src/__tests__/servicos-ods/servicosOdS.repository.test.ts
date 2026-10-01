import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { ServicosOdSRepository } from '../../modules/servicos-ods/servicosOdS.repository';
import { ServicosRepository } from '../../modules/servicos/servicos.repository';
import { FuncionariosRepository } from '../../modules/funcionarios/funcionarios.repository';
import { CargosRepository } from '../../modules/cargos/cargos.repository';
import { PaisesRepository } from '../../modules/paises/paises.repository';
import { EstadosRepository } from '../../modules/estados/estados.repository';
import { CidadesRepository } from '../../modules/cidades/cidades.repository';
import { OrdensServicoRepository } from '../../modules/ordens-servico/ordensServico.repository';
import { AparelhosRepository } from '../../modules/aparelhos/aparelhos.repository';
import { EquipamentosRepository } from '../../modules/equipamentos/equipamentos.repository';
import { ClientesRepository } from '../../modules/clientes/clientes.repository';
import { CondicoesPagamentoRepository } from '../../modules/condicoes-pagamento/condicoesPagamento.repository';

const repo             = new ServicosOdSRepository();
const servicosRepo      = new ServicosRepository();
const funcionariosRepo  = new FuncionariosRepository();
const cargosRepo        = new CargosRepository();
const paisesRepo        = new PaisesRepository();
const estadosRepo       = new EstadosRepository();
const cidadesRepo       = new CidadesRepository();
const osRepo            = new OrdensServicoRepository();
const aparelhosRepo     = new AparelhosRepository();
const equipamentosRepo  = new EquipamentosRepository();
const clientesRepo      = new ClientesRepository();
const condicoesRepo     = new CondicoesPagamentoRepository();

async function CriarOSEServicoDeTeste ( transaction: Parameters < typeof osRepo.Create >[ 2 ] )
{
    const pais = await paisesRepo.Create
    ( { pais: 'Brasil', sigla: 'BR', ddi: `${ Date.now() % 1000 }`, moeda: 'BRL' }, 1, transaction );
    const estado = await estadosRepo.Create
    ( { codPais: pais.codPais, uf: 'SP', estado: 'São Paulo' }, 1, transaction );
    const cidade = await cidadesRepo.Create
    ( { codEstado: estado.codEstado, cidade: 'Campinas', ddd: '19' }, 1, transaction );
    const condicao = await condicoesRepo.Create
    ( { descricao: 'À Vista', juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0, parcelas: [] }, 1, transaction );
    const cliente = await clientesRepo.Create
    (
        {
            tipoPessoa: 'FISICA', cliente: 'Cliente Teste', codCidade: cidade.codCidade,
            codCondDePag: condicao.codCondDePag, enderecoCl: 'Rua X', bairroCl: 'Centro',
            cepCl: '13000000', foneCl: '19999999999',
        } as never,
        1,
        transaction
    );
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
    const os = await osRepo.Create
    (
        {
            codCliente: cliente.codCliente, atendente: 'Ana',
            defeito: 'Não liga', tipoOdS: 'Garantia',
            codAparelho: aparelho.codAparelho, codEquipamento: equipamento.codEquipamento,
        },
        1,
        transaction
    );

    const cargo = await cargosRepo.Create ( { cargo: 'Técnico' }, 1, transaction );
    const funcionario = await funcionariosRepo.Create
    ( { codCidade: cidade.codCidade, codCargo: cargo.codCargo, funcionario: 'Ana Silva', funcFone: '19999999999' }, 1, transaction );
    const servico = await servicosRepo.Create
    ( { servico: 'Formatação', valor: '150.00', codFuncionario: funcionario.codFuncionario }, 1, transaction );

    return { os, servico };
}

describe ( 'ServicosOdSRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere com os valores enviados e ListByOS recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { os, servico } = await CriarOSEServicoDeTeste ( transaction );

            const linha = await repo.Create
            ( os.numOdS, { codServico: servico.codServico, qtdServico: 2 }, 1, transaction );

            expect ( linha.qtdServico ).toBe ( 2 );

            const lista = await repo.ListByOS ( os.numOdS, transaction );
            expect ( lista ).toHaveLength ( 1 );
            expect ( lista[ 0 ].codServico ).toBe ( servico.codServico );
        });
    });

    it ( 'Update altera a quantidade dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { os, servico } = await CriarOSEServicoDeTeste ( transaction );

            await repo.Create ( os.numOdS, { codServico: servico.codServico, qtdServico: 1 }, 1, transaction );
            const atualizado = await repo.Update
            ( os.numOdS, servico.codServico, { codServico: servico.codServico, qtdServico: 3 }, 1, transaction );

            expect ( atualizado?.qtdServico ).toBe ( 3 );
        });
    });

    it ( 'Delete faz soft delete e a linha some de ListByOS', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { os, servico } = await CriarOSEServicoDeTeste ( transaction );

            await repo.Create ( os.numOdS, { codServico: servico.codServico, qtdServico: 1 }, 1, transaction );
            await repo.Delete ( os.numOdS, servico.codServico, 1, transaction );

            const lista = await repo.ListByOS ( os.numOdS, transaction );
            expect ( lista ).toHaveLength ( 0 );
        });
    });
});
