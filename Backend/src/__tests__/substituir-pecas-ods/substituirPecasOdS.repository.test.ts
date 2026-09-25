import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { SubstituirPecasOdSRepository } from '../../modules/substituir-pecas-ods/substituirPecasOdS.repository';
import { PecasRepository } from '../../modules/pecas/pecas.repository';
import { PaisesRepository } from '../../modules/paises/paises.repository';
import { EstadosRepository } from '../../modules/estados/estados.repository';
import { CidadesRepository } from '../../modules/cidades/cidades.repository';
import { OrdensServicoRepository } from '../../modules/ordens-servico/ordensServico.repository';
import { AparelhosRepository } from '../../modules/aparelhos/aparelhos.repository';
import { EquipamentosRepository } from '../../modules/equipamentos/equipamentos.repository';
import { ClientesRepository } from '../../modules/clientes/clientes.repository';
import { CondicoesPagamentoRepository } from '../../modules/condicoes-pagamento/condicoesPagamento.repository';

const repo             = new SubstituirPecasOdSRepository();
const pecasRepo         = new PecasRepository();
const paisesRepo        = new PaisesRepository();
const estadosRepo       = new EstadosRepository();
const cidadesRepo       = new CidadesRepository();
const osRepo            = new OrdensServicoRepository();
const aparelhosRepo     = new AparelhosRepository();
const equipamentosRepo  = new EquipamentosRepository();
const clientesRepo      = new ClientesRepository();
const condicoesRepo     = new CondicoesPagamentoRepository();

async function CriarOSEPecaDeTeste ( transaction: Parameters < typeof osRepo.Create >[ 2 ] )
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
            numOdS: `OS${ Date.now() % 1000000 }`, codCliente: cliente.codCliente, atendente: 'Ana',
            defeito: 'Não liga', tipoOdS: 'Garantia',
            codAparelho: aparelho.codAparelho, codEquipamento: equipamento.codEquipamento,
        },
        1,
        transaction
    );
    const peca = await pecasRepo.Create ( { peca: 'Placa-mãe' }, 1, transaction );

    return { os, peca };
}

describe ( 'SubstituirPecasOdSRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere com os valores enviados e ListByOS recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { os, peca } = await CriarOSEPecaDeTeste ( transaction );

            const linha = await repo.Create
            ( os.numOdS, { codPeca: peca.codPeca, qtdPeca: 1, vlrUnitarioPeca: 95 }, 1, transaction );

            expect ( linha.qtdPeca ).toBe ( 1 );
            expect ( linha.vlrUnitarioPeca ).toBe ( 95 );

            const lista = await repo.ListByOS ( os.numOdS, transaction );
            expect ( lista ).toHaveLength ( 1 );
        });
    });

    it ( 'Update altera quantidade e valor unitário dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { os, peca } = await CriarOSEPecaDeTeste ( transaction );

            await repo.Create ( os.numOdS, { codPeca: peca.codPeca, qtdPeca: 1, vlrUnitarioPeca: 95 }, 1, transaction );
            const atualizado = await repo.Update
            ( os.numOdS, peca.codPeca, { codPeca: peca.codPeca, qtdPeca: 2, vlrUnitarioPeca: 80 }, 1, transaction );

            expect ( atualizado?.qtdPeca ).toBe ( 2 );
            expect ( atualizado?.vlrUnitarioPeca ).toBe ( 80 );
        });
    });

    it ( 'Delete faz soft delete e a linha some de ListByOS', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const { os, peca } = await CriarOSEPecaDeTeste ( transaction );

            await repo.Create ( os.numOdS, { codPeca: peca.codPeca, qtdPeca: 1, vlrUnitarioPeca: 95 }, 1, transaction );
            await repo.Delete ( os.numOdS, peca.codPeca, 1, transaction );

            const lista = await repo.ListByOS ( os.numOdS, transaction );
            expect ( lista ).toHaveLength ( 0 );
        });
    });
});
