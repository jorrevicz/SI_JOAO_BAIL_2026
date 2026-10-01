import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdensServicoService } from '../../modules/ordens-servico/ordensServico.service';

vi.mock ( '../../shared/transaction/withTransaction', () =>
({
    WithTransaction: ( fn: ( tx: unknown ) => unknown ) => fn ( {} ),
}) );

function MakeOsRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        List:                  vi.fn(),
        FindById:               vi.fn(),
        Create:                 vi.fn(),
        RegistrarDiagnostico:   vi.fn(),
        AtualizarObsTecnica:    vi.fn(),
        AtualizarSituacao:      vi.fn(),
        ...over,
    };
}

function MakeSimpleRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        FindById: vi.fn(),
        Create:   vi.fn(),
        ...over,
    };
}

function MakeProcedimentosOdSRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        ListByOS:       vi.fn(),
        CreateEstrutura: vi.fn(),
        UpdateOrdem:     vi.fn(),
        UpdateChecagem:  vi.fn(),
        Delete:          vi.fn(),
        ...over,
    };
}

function MakeOdSLinhaRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        ListByOS: vi.fn().mockResolvedValue ( [] ),
        FindOne:  vi.fn(),
        Create:   vi.fn(),
        Update:   vi.fn(),
        Delete:   vi.fn(),
        Aprovar:  vi.fn(),
        ...over,
    };
}

const aparelho = {
    aparelho: 'Notebook',
    serie:    null,
    modelo:   'Inspiron 15',
    voltagem: 'Bivolt',
    garantia: '12 meses',
};

const equipamento = {
    equipamento:    'Notebook Dell',
    grupoUser:      null,
    soEq:           'Win11',
    socketEq:       'BGA',
    memoriaRam:     '8GB',
    tipoOffice:     '2021',
    placaMae:       'Dell 0XYZ',
    bios:           '1.2.0',
    capacidadeRam:  '8GB',
    possuiSSD:      true,
    possuiHD:       false,
    capacidadeArmz: '256GB',
    usoArmz:        '50%',
};

describe ( 'OrdensServicoService', () =>
{
    let repo:               ReturnType < typeof MakeOsRepo >;
    let aparelhosRepo:      ReturnType < typeof MakeSimpleRepo >;
    let equipamentosRepo:   ReturnType < typeof MakeSimpleRepo >;
    let procedimentosRepo:  ReturnType < typeof MakeSimpleRepo >;
    let procedimentosOdSRepo: ReturnType < typeof MakeProcedimentosOdSRepo >;
    let clientesRepo:       ReturnType < typeof MakeSimpleRepo >;
    let servicosRepo:          ReturnType < typeof MakeSimpleRepo >;
    let servicosOdSRepo:        ReturnType < typeof MakeOdSLinhaRepo >;
    let pecasRepo:              ReturnType < typeof MakeSimpleRepo >;
    let orcamentoPecasOdSRepo:  ReturnType < typeof MakeOdSLinhaRepo >;
    let substituirPecasOdSRepo: ReturnType < typeof MakeOdSLinhaRepo >;
    let service:            OrdensServicoService;

    beforeEach ( () =>
    {
        repo                 = MakeOsRepo();
        aparelhosRepo        = MakeSimpleRepo();
        equipamentosRepo     = MakeSimpleRepo();
        procedimentosRepo    = MakeSimpleRepo();
        procedimentosOdSRepo = MakeProcedimentosOdSRepo();
        clientesRepo         = MakeSimpleRepo();
        servicosRepo          = MakeSimpleRepo();
        servicosOdSRepo        = MakeOdSLinhaRepo();
        pecasRepo              = MakeSimpleRepo();
        orcamentoPecasOdSRepo  = MakeOdSLinhaRepo();
        substituirPecasOdSRepo = MakeOdSLinhaRepo();

        service = new OrdensServicoService
        (
            repo as never,
            aparelhosRepo as never,
            equipamentosRepo as never,
            procedimentosRepo as never,
            procedimentosOdSRepo as never,
            clientesRepo as never,
            servicosRepo as never,
            servicosOdSRepo as never,
            pecasRepo as never,
            orcamentoPecasOdSRepo as never,
            substituirPecasOdSRepo as never,
        );
    });

    it ( 'FindOrdemServico lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindOrdemServico ( 1 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'FindOrdemServico junta aparelho, equipamento e checklist', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1, codAparelho: 1, codEquipamento: 2 } );
        aparelhosRepo.FindById.mockResolvedValue ( { codAparelho: 1, ...aparelho } );
        equipamentosRepo.FindById.mockResolvedValue ( { codEquipamento: 2, ...equipamento } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );

        const resultado = await service.FindOrdemServico ( 1 );

        expect ( resultado.aparelho ).toMatchObject ( { codAparelho: 1 } );
        expect ( resultado.equipamento ).toMatchObject ( { codEquipamento: 2 } );
        expect ( resultado.procedimentos ).toEqual ( [] );
    });

    it ( 'AbrirOS lança 400 quando cliente informado não existe', async () =>
    {
        clientesRepo.FindById.mockResolvedValue ( null );

        await expect (
            service.AbrirOS (
                {
                    codCliente: 99, atendente: 'Ana', defeito: 'Não liga',
                    tipoOdS: 'Garantia', aparelho, equipamento,
                } as never,
                1
            )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( aparelhosRepo.Create ).not.toHaveBeenCalled();
        expect ( repo.Create ).not.toHaveBeenCalled();
    });

    it ( 'AbrirOS cria Aparelho, Equipamento e o cabeçalho da OS dentro da transação', async () =>
    {
        clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
        aparelhosRepo.Create.mockResolvedValue ( { codAparelho: 10, ...aparelho } );
        equipamentosRepo.Create.mockResolvedValue ( { codEquipamento: 20, ...equipamento } );
        repo.Create.mockResolvedValue ( { numOdS: 1, codAparelho: 10, codEquipamento: 20 } );

        const resultado = await service.AbrirOS (
            {
                codCliente: 1, atendente: 'Ana', defeito: 'Não liga',
                tipoOdS: 'Garantia', aparelho, equipamento,
            } as never,
            1
        );

        expect ( aparelhosRepo.Create ).toHaveBeenCalledWith ( aparelho, 1, {} );
        expect ( equipamentosRepo.Create ).toHaveBeenCalledWith ( equipamento, 1, {} );
        expect ( repo.Create ).toHaveBeenCalledWith
        (
            expect.objectContaining ( { codAparelho: 10, codEquipamento: 20 } ),
            1,
            {}
        );
        expect ( resultado ).toMatchObject ( { numOdS: 1 } );
    });

    it ( 'DefinirProcedimentosOS lança 404 quando a OS não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect (
            service.DefinirProcedimentosOS ( 999999, { procedimentos: [] }, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DefinirProcedimentosOS lança 400 quando codProcedimento informado não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1 } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        procedimentosRepo.FindById.mockResolvedValue ( null );

        await expect (
            service.DefinirProcedimentosOS
            (
                1,
                { procedimentos: [ { codProcedimento: 99, ordem: 1 } ] },
                1
            )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( procedimentosOdSRepo.CreateEstrutura ).not.toHaveBeenCalled();
    });

    it ( 'DefinirProcedimentosOS cria a estrutura de um procedimento novo na lista', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1, codAparelho: 1, codEquipamento: 2 } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        procedimentosRepo.FindById.mockResolvedValue ( { codProcedimento: 1 } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        const item = { codProcedimento: 1, ordem: 1 };

        await service.DefinirProcedimentosOS ( 1, { procedimentos: [ item ] }, 1 );

        expect ( procedimentosOdSRepo.CreateEstrutura ).toHaveBeenCalledWith ( 1, item, 1, {} );
        expect ( procedimentosOdSRepo.UpdateOrdem ).not.toHaveBeenCalled();
    });

    it ( 'DefinirProcedimentosOS atualiza a ordem de um procedimento já presente na lista', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1, codAparelho: 1, codEquipamento: 2 } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue
        ([
            { numOdS: 1, codProcedimento: 1, ordem: 2 },
        ]);
        procedimentosRepo.FindById.mockResolvedValue ( { codProcedimento: 1 } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        await service.DefinirProcedimentosOS ( 1, { procedimentos: [ { codProcedimento: 1, ordem: 1 } ] }, 1 );

        expect ( procedimentosOdSRepo.UpdateOrdem ).toHaveBeenCalledWith ( 1, 1, 1, 1, {} );
        expect ( procedimentosOdSRepo.CreateEstrutura ).not.toHaveBeenCalled();
    });

    it ( 'DefinirProcedimentosOS remove (soft delete) procedimento ausente da lista enviada', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1, codAparelho: 1, codEquipamento: 2 } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue
        ([
            { numOdS: 1, codProcedimento: 1, ordem: 1 },
        ]);
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        await service.DefinirProcedimentosOS ( 1, { procedimentos: [] }, 1 );

        expect ( procedimentosOdSRepo.Delete ).toHaveBeenCalledWith ( 1, 1, 1, {} );
        expect ( procedimentosRepo.FindById ).not.toHaveBeenCalled();
    });

    it ( 'RegistrarDiagnostico lança 404 quando a OS não existe', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( null );

        await expect (
            service.RegistrarDiagnostico ( 999999, { historicoManutencao: null, procedimentos: [], orcamentoPecas: [] }, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'RegistrarDiagnostico lança 400 quando o procedimento não faz parte da checklist', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 1 } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );

        const item = { codProcedimento: 99, posicao: 'Embaixo', checagem: true, dthFim: new Date ( '2026-01-01' ) };

        await expect (
            service.RegistrarDiagnostico
            (
                1,
                { historicoManutencao: null, procedimentos: [ item ], orcamentoPecas: [] },
                1
            )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( procedimentosOdSRepo.UpdateChecagem ).not.toHaveBeenCalled();
    });

    it ( 'RegistrarDiagnostico preenche a checagem de um procedimento já presente na checklist', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 1 } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue
        ([
            { numOdS: 1, codProcedimento: 1, ordem: 1, posicao: null, checagem: null },
        ]);
        repo.FindById.mockResolvedValue ( { numOdS: 1, codAparelho: 1, codEquipamento: 2 } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        const item = { codProcedimento: 1, posicao: 'Embaixo', checagem: true, dthFim: new Date ( '2026-01-01' ) };

        await service.RegistrarDiagnostico ( 1, { historicoManutencao: null, procedimentos: [ item ], orcamentoPecas: [] }, 1 );

        expect ( procedimentosOdSRepo.UpdateChecagem ).toHaveBeenCalledWith ( 1, 1, item, 1, {} );
        expect ( procedimentosOdSRepo.CreateEstrutura ).not.toHaveBeenCalled();
        expect ( procedimentosOdSRepo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'RegistrarDiagnostico avança a situação de Aberta para Em execução na primeira chamada', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 1, situacao: 'Aberta' } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        orcamentoPecasOdSRepo.ListByOS.mockResolvedValue ( [] );
        repo.FindById.mockResolvedValue ( { numOdS: 1, codAparelho: 1, codEquipamento: 2, situacao: 'Em execução' } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        await service.RegistrarDiagnostico ( 1, { historicoManutencao: null, procedimentos: [], orcamentoPecas: [] }, 1 );

        expect ( repo.AtualizarSituacao ).toHaveBeenCalledWith ( 1, 'Em execução', 1, {} );
    });

    it ( 'RegistrarDiagnostico reconcilia o orçamento de peças por diferença de conjuntos', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 1, situacao: 'Em execução' } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        orcamentoPecasOdSRepo.ListByOS
            .mockResolvedValueOnce ( [ { numOdS: 1, codPeca: 9, vlrPv: '10.00' } ] )
            .mockResolvedValueOnce ( [ { codPeca: 5, aprovado: false } ] );
        pecasRepo.FindById.mockResolvedValue ( { codPeca: 5 } );
        repo.FindById.mockResolvedValue ( { numOdS: 1, codAparelho: 1, codEquipamento: 2, situacao: 'Em execução' } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        await service.RegistrarDiagnostico
        (
            1,
            { historicoManutencao: null, procedimentos: [], orcamentoPecas: [ { codPeca: 5, vlrPv: '89.90' } ] },
            1
        );

        expect ( orcamentoPecasOdSRepo.Delete ).toHaveBeenCalledWith ( 1, 9, 1, {} );
        expect ( orcamentoPecasOdSRepo.Create ).toHaveBeenCalledWith ( 1, { codPeca: 5, vlrPv: '89.90' }, 1, {} );
    });

    it ( 'RegistrarDiagnostico lança 400 quando codPeca informado não existe', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 1 } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        orcamentoPecasOdSRepo.ListByOS.mockResolvedValue ( [] );
        pecasRepo.FindById.mockResolvedValue ( null );

        await expect (
            service.RegistrarDiagnostico
            (
                1,
                { historicoManutencao: null, procedimentos: [], orcamentoPecas: [ { codPeca: 99, vlrPv: '89.90' } ] },
                1
            )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( orcamentoPecasOdSRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'RegistrarDiagnostico coloca a OS em Aguardando aprovação quando há peça orçada pendente', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 1, situacao: 'Em execução' } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        pecasRepo.FindById.mockResolvedValue ( { codPeca: 5 } );
        orcamentoPecasOdSRepo.ListByOS
            .mockResolvedValueOnce ( [] )
            .mockResolvedValueOnce ( [ { codPeca: 5, aprovado: false } ] );
        repo.FindById.mockResolvedValue ( { numOdS: 1, situacao: 'Em execução' } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        await service.RegistrarDiagnostico ( 1, { historicoManutencao: null, procedimentos: [], orcamentoPecas: [ { codPeca: 5, vlrPv: '89.90' } ] }, 1 );

        expect ( repo.AtualizarSituacao ).toHaveBeenCalledWith ( 1, 'Aguardando aprovação', 1, {} );
    });

    it ( 'RegistrarExecucao reconcilia serviços e atualiza as observações técnicas', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1, situacao: 'Em execução' } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        servicosOdSRepo.ListByOS.mockResolvedValue ( [ { numOdS: 1, codServico: 9, qtdServico: 1 } ] );
        servicosRepo.FindById.mockResolvedValue ( { codServico: 1 } );
        repo.AtualizarObsTecnica.mockResolvedValue ( { numOdS: 1 } );

        await service.RegistrarExecucao
        (
            1,
            { servicos: [ { codServico: 1, qtdServico: 2 } ], obsTecnica: 'Placa-mãe trocada' },
            1
        );

        expect ( servicosOdSRepo.Delete ).toHaveBeenCalledWith ( 1, 9, 1, {} );
        expect ( servicosOdSRepo.Create ).toHaveBeenCalledWith ( 1, { codServico: 1, qtdServico: 2 }, 1, {} );
        expect ( repo.AtualizarObsTecnica ).toHaveBeenCalledWith ( 1, 'Placa-mãe trocada', 1, {} );
    });

    it ( 'RegistrarExecucao lança 400 quando o serviço informado não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1, situacao: 'Em execução' } );
        servicosRepo.FindById.mockResolvedValue ( null );

        await expect (
            service.RegistrarExecucao ( 1, { servicos: [ { codServico: 99, qtdServico: 1 } ], obsTecnica: null }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( servicosOdSRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'AprovarOrcamentoPeca lança 404 quando o item não existe para a OS', async () =>
    {
        orcamentoPecasOdSRepo.Aprovar.mockResolvedValue ( null );

        await expect ( service.AprovarOrcamentoPeca ( 1, 5, 1 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'AprovarOrcamentoPeca aprova o item e recalcula a situação', async () =>
    {
        orcamentoPecasOdSRepo.Aprovar.mockResolvedValue ( { codPeca: 5, aprovado: true } );
        repo.FindById.mockResolvedValue ( { numOdS: 1, situacao: 'Aguardando aprovação' } );
        orcamentoPecasOdSRepo.ListByOS.mockResolvedValue ( [ { codPeca: 5, aprovado: true } ] );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );

        await service.AprovarOrcamentoPeca ( 1, 5, 1 );

        expect ( repo.AtualizarSituacao ).toHaveBeenCalledWith ( 1, 'Em execução', 1, {} );
    });

    it ( 'ReprovarOrcamentoPeca lança 404 quando o item não existe para a OS', async () =>
    {
        orcamentoPecasOdSRepo.FindOne.mockResolvedValue ( null );

        await expect ( service.ReprovarOrcamentoPeca ( 1, 5, 1 ) ).rejects.toMatchObject ( { status: 404 } );

        expect ( orcamentoPecasOdSRepo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'ReprovarOrcamentoPeca remove (soft delete) o item do orçamento', async () =>
    {
        orcamentoPecasOdSRepo.FindOne.mockResolvedValue ( { codPeca: 5, aprovado: false } );
        repo.FindById.mockResolvedValue ( { numOdS: 1, situacao: 'Aguardando aprovação' } );
        orcamentoPecasOdSRepo.ListByOS.mockResolvedValue ( [] );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );

        await service.ReprovarOrcamentoPeca ( 1, 5, 1 );

        expect ( orcamentoPecasOdSRepo.Delete ).toHaveBeenCalledWith ( 1, 5, 1, {} );
        expect ( repo.AtualizarSituacao ).toHaveBeenCalledWith ( 1, 'Em execução', 1, {} );
    });

    it ( 'RegistrarSubstituicaoPecas lança 409 quando a peça não tem orçamento aprovado', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1, situacao: 'Em execução' } );
        pecasRepo.FindById.mockResolvedValue ( { codPeca: 5 } );
        orcamentoPecasOdSRepo.FindOne.mockResolvedValue ( { codPeca: 5, aprovado: false } );

        await expect (
            service.RegistrarSubstituicaoPecas ( 1, { pecas: [ { codPeca: 5, qtdPeca: 1, vlrUnitarioPeca: 90 } ] }, 1 )
        ).rejects.toMatchObject ( { status: 409 } );

        expect ( substituirPecasOdSRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'RegistrarSubstituicaoPecas registra a peça quando o orçamento está aprovado', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 1, situacao: 'Em execução' } );
        pecasRepo.FindById.mockResolvedValue ( { codPeca: 5 } );
        orcamentoPecasOdSRepo.FindOne.mockResolvedValue ( { codPeca: 5, aprovado: true } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );

        const item = { codPeca: 5, qtdPeca: 1, vlrUnitarioPeca: 95 };
        await service.RegistrarSubstituicaoPecas ( 1, { pecas: [ item ] }, 1 );

        expect ( substituirPecasOdSRepo.Create ).toHaveBeenCalledWith ( 1, item, 1, {} );
    });
});
