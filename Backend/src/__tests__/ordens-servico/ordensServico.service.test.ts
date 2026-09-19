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
        ListByOS: vi.fn(),
        Create:   vi.fn(),
        Update:   vi.fn(),
        Delete:   vi.fn(),
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
    let service:            OrdensServicoService;

    beforeEach ( () =>
    {
        repo                 = MakeOsRepo();
        aparelhosRepo        = MakeSimpleRepo();
        equipamentosRepo     = MakeSimpleRepo();
        procedimentosRepo    = MakeSimpleRepo();
        procedimentosOdSRepo = MakeProcedimentosOdSRepo();
        clientesRepo         = MakeSimpleRepo();

        service = new OrdensServicoService
        (
            repo as never,
            aparelhosRepo as never,
            equipamentosRepo as never,
            procedimentosRepo as never,
            procedimentosOdSRepo as never,
            clientesRepo as never,
        );
    });

    it ( 'FindOrdemServico lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindOrdemServico ( 'OS000001' ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'FindOrdemServico junta aparelho, equipamento e checklist', async () =>
    {
        repo.FindById.mockResolvedValue ( { numOdS: 'OS000001', codAparelho: 1, codEquipamento: 2 } );
        aparelhosRepo.FindById.mockResolvedValue ( { codAparelho: 1, ...aparelho } );
        equipamentosRepo.FindById.mockResolvedValue ( { codEquipamento: 2, ...equipamento } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );

        const resultado = await service.FindOrdemServico ( 'OS000001' );

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
                    numOdS: 'OS000001', codCliente: 99, atendente: 'Ana', defeito: 'Não liga',
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
        repo.Create.mockResolvedValue ( { numOdS: 'OS000001', codAparelho: 10, codEquipamento: 20 } );

        const resultado = await service.AbrirOS (
            {
                numOdS: 'OS000001', codCliente: 1, atendente: 'Ana', defeito: 'Não liga',
                tipoOdS: 'Garantia', aparelho, equipamento,
            } as never,
            1
        );

        expect ( aparelhosRepo.Create ).toHaveBeenCalledWith ( aparelho, 1, {} );
        expect ( equipamentosRepo.Create ).toHaveBeenCalledWith ( equipamento, 1, {} );
        expect ( repo.Create ).toHaveBeenCalledWith
        (
            expect.objectContaining ( { numOdS: 'OS000001', codAparelho: 10, codEquipamento: 20 } ),
            1,
            {}
        );
        expect ( resultado ).toMatchObject ( { numOdS: 'OS000001' } );
    });

    it ( 'RegistrarDiagnostico lança 404 quando a OS não existe', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( null );

        await expect (
            service.RegistrarDiagnostico ( 'OS999999', { obsTecnica: 'x', historicoManutencao: null, procedimentos: [] }, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'RegistrarDiagnostico remove checagem ausente da lista enviada', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 'OS000001' } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue
        ([
            { numOdS: 'OS000001', codProcedimento: 1, posicao: 'Embaixo', checagem: 'SIM' },
        ]);
        repo.FindById.mockResolvedValue ( { numOdS: 'OS000001', codAparelho: 1, codEquipamento: 2 } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        await service.RegistrarDiagnostico ( 'OS000001', { obsTecnica: null, historicoManutencao: null, procedimentos: [] }, 1 );

        expect ( procedimentosOdSRepo.Delete ).toHaveBeenCalledWith ( 'OS000001', 1, 1, {} );
        expect ( procedimentosRepo.FindById ).not.toHaveBeenCalled();
    });

    it ( 'RegistrarDiagnostico lança 400 quando codProcedimento informado não existe', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 'OS000001' } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        procedimentosRepo.FindById.mockResolvedValue ( null );

        await expect (
            service.RegistrarDiagnostico
            (
                'OS000001',
                { obsTecnica: null, historicoManutencao: null, procedimentos: [ { codProcedimento: 99, posicao: 'Embaixo', checagem: 'SIM' } ] },
                1
            )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( procedimentosOdSRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'RegistrarDiagnostico cria nova checagem quando codProcedimento ainda não respondido', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 'OS000001' } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue ( [] );
        procedimentosRepo.FindById.mockResolvedValue ( { codProcedimento: 1 } );
        repo.FindById.mockResolvedValue ( { numOdS: 'OS000001', codAparelho: 1, codEquipamento: 2 } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        const item = { codProcedimento: 1, posicao: 'Embaixo', checagem: 'SIM' };

        await service.RegistrarDiagnostico ( 'OS000001', { obsTecnica: null, historicoManutencao: null, procedimentos: [ item ] }, 1 );

        expect ( procedimentosOdSRepo.Create ).toHaveBeenCalledWith ( 'OS000001', item, 1, {} );
        expect ( procedimentosOdSRepo.Update ).not.toHaveBeenCalled();
    });

    it ( 'RegistrarDiagnostico atualiza checagem já respondida para o mesmo codProcedimento', async () =>
    {
        repo.RegistrarDiagnostico.mockResolvedValue ( { numOdS: 'OS000001' } );
        procedimentosOdSRepo.ListByOS.mockResolvedValue
        ([
            { numOdS: 'OS000001', codProcedimento: 1, posicao: 'Embaixo', checagem: 'NÃO' },
        ]);
        procedimentosRepo.FindById.mockResolvedValue ( { codProcedimento: 1 } );
        repo.FindById.mockResolvedValue ( { numOdS: 'OS000001', codAparelho: 1, codEquipamento: 2 } );
        aparelhosRepo.FindById.mockResolvedValue ( {} );
        equipamentosRepo.FindById.mockResolvedValue ( {} );

        const item = { codProcedimento: 1, posicao: 'Embaixo', checagem: 'SIM' };

        await service.RegistrarDiagnostico ( 'OS000001', { obsTecnica: null, historicoManutencao: null, procedimentos: [ item ] }, 1 );

        expect ( procedimentosOdSRepo.Update ).toHaveBeenCalledWith ( 'OS000001', 1, item, 1, {} );
        expect ( procedimentosOdSRepo.Create ).not.toHaveBeenCalled();
        expect ( procedimentosOdSRepo.Delete ).not.toHaveBeenCalled();
    });
});
