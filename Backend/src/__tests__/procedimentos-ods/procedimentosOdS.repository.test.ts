import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { ProcedimentosOdSRepository } from '../../modules/procedimentos-ods/procedimentosOdS.repository';
import { OrdensServicoRepository } from '../../modules/ordens-servico/ordensServico.repository';
import { AparelhosRepository } from '../../modules/aparelhos/aparelhos.repository';
import { EquipamentosRepository } from '../../modules/equipamentos/equipamentos.repository';
import { ClientesRepository } from '../../modules/clientes/clientes.repository';
import { PaisesRepository } from '../../modules/paises/paises.repository';
import { EstadosRepository } from '../../modules/estados/estados.repository';
import { CidadesRepository } from '../../modules/cidades/cidades.repository';
import { CondicoesPagamentoRepository } from '../../modules/condicoes-pagamento/condicoesPagamento.repository';
import { ProcedimentosRepository } from '../../modules/procedimentos/procedimentos.repository';

const procedimentosOdSRepo = new ProcedimentosOdSRepository();
const osRepo            = new OrdensServicoRepository();
const aparelhosRepo     = new AparelhosRepository();
const equipamentosRepo  = new EquipamentosRepository();
const clientesRepo      = new ClientesRepository();
const paisesRepo        = new PaisesRepository();
const estadosRepo       = new EstadosRepository();
const cidadesRepo       = new CidadesRepository();
const condicoesRepo     = new CondicoesPagamentoRepository();
const procedimentosRepo = new ProcedimentosRepository();

async function CriarOSDeTeste
(
    numOdS: string,
    transaction: Parameters < typeof osRepo.Create >[ 2 ]
)
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

    return osRepo.Create
    (
        {
            numOdS, codCliente: cliente.codCliente, atendente: 'Ana',
            defeito: 'Não liga', tipoOdS: 'Garantia',
            codAparelho: aparelho.codAparelho, codEquipamento: equipamento.codEquipamento,
        },
        1,
        transaction
    );
}

describe ( 'ProcedimentosOdSRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'CreateEstrutura insere a linha só com procedimento e ordem, checagem nasce nula', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            await CriarOSDeTeste ( 'OS100001', transaction );
            const procedimento = await procedimentosRepo.Create ( { procedimento: 'Testar bateria' }, 1, transaction );

            const linha = await procedimentosOdSRepo.CreateEstrutura
            ( 'OS100001', { codProcedimento: procedimento.codProcedimento, ordem: 1 }, 1, transaction );

            expect ( linha.ordem ).toBe ( 1 );
            expect ( linha.posicao ).toBeNull();
            expect ( linha.checagem ).toBeNull();
            expect ( linha.dthFim ).toBeNull();
        });
    });

    it ( 'ListByOS retorna a checklist ordenada pela coluna ordem', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            await CriarOSDeTeste ( 'OS100002', transaction );
            const primeiro  = await procedimentosRepo.Create ( { procedimento: 'Testar bateria' }, 1, transaction );
            const segundo   = await procedimentosRepo.Create ( { procedimento: 'Limpar cooler' }, 1, transaction );

            await procedimentosOdSRepo.CreateEstrutura ( 'OS100002', { codProcedimento: segundo.codProcedimento, ordem: 2 }, 1, transaction );
            await procedimentosOdSRepo.CreateEstrutura ( 'OS100002', { codProcedimento: primeiro.codProcedimento, ordem: 1 }, 1, transaction );

            const lista = await procedimentosOdSRepo.ListByOS ( 'OS100002', transaction );

            expect ( lista.map ( ( item ) => item.codProcedimento ) ).toEqual
            ( [ primeiro.codProcedimento, segundo.codProcedimento ] );
        });
    });

    it ( 'UpdateOrdem troca a posição de um item sem tocar nos campos de checagem', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            await CriarOSDeTeste ( 'OS100003', transaction );
            const procedimento = await procedimentosRepo.Create ( { procedimento: 'Testar bateria' }, 1, transaction );
            await procedimentosOdSRepo.CreateEstrutura ( 'OS100003', { codProcedimento: procedimento.codProcedimento, ordem: 1 }, 1, transaction );

            const atualizada = await procedimentosOdSRepo.UpdateOrdem
            ( 'OS100003', procedimento.codProcedimento, 3, 1, transaction );

            expect ( atualizada?.ordem ).toBe ( 3 );
            expect ( atualizada?.checagem ).toBeNull();
        });
    });

    it ( 'UpdateChecagem preenche os campos de execução sem alterar a ordem', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            await CriarOSDeTeste ( 'OS100004', transaction );
            const procedimento = await procedimentosRepo.Create ( { procedimento: 'Testar bateria' }, 1, transaction );
            await procedimentosOdSRepo.CreateEstrutura ( 'OS100004', { codProcedimento: procedimento.codProcedimento, ordem: 5 }, 1, transaction );

            const dthFim = new Date ( '2026-01-10T10:00:00Z' );
            const atualizada = await procedimentosOdSRepo.UpdateChecagem
            (
                'OS100004',
                procedimento.codProcedimento,
                { codProcedimento: procedimento.codProcedimento, posicao: 'Embaixo', checagem: true, dthFim, obsProcedimento: null },
                1,
                transaction
            );

            expect ( atualizada?.posicao ).toBe ( 'Embaixo' );
            expect ( atualizada?.checagem ).toBe ( true );
            expect ( atualizada?.dthFim?.toISOString() ).toBe ( dthFim.toISOString() );
            expect ( atualizada?.ordem ).toBe ( 5 );
        });
    });

    it ( 'Delete remove (soft delete) a linha da checklist', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            await CriarOSDeTeste ( 'OS100005', transaction );
            const procedimento = await procedimentosRepo.Create ( { procedimento: 'Testar bateria' }, 1, transaction );
            await procedimentosOdSRepo.CreateEstrutura ( 'OS100005', { codProcedimento: procedimento.codProcedimento, ordem: 1 }, 1, transaction );

            await procedimentosOdSRepo.Delete ( 'OS100005', procedimento.codProcedimento, 1, transaction );

            const lista = await procedimentosOdSRepo.ListByOS ( 'OS100005', transaction );
            expect ( lista ).toEqual ( [] );
        });
    });
});
