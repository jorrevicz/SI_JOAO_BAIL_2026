import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CondicoesPagamentoService } from '../../modules/condicoes-pagamento/condicoesPagamento.service';

vi.mock ( '../../shared/transaction/withTransaction', () =>
({
    WithTransaction: ( fn: ( tx: unknown ) => unknown ) => fn ( {} ),
}) );

function MakeRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        List:                   vi.fn(),
        FindById:                vi.fn(),
        Create:                  vi.fn(),
        Update:                  vi.fn(),
        Delete:                  vi.fn(),
        HasExternalReferences:   vi.fn(),
        ...over,
    };
}

function MakeParcelasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        List:     vi.fn(),
        FindById: vi.fn(),
        Create:   vi.fn(),
        Update:   vi.fn(),
        Delete:   vi.fn(),
        ...over,
    };
}

function MakeFormasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        FindById: vi.fn(),
        ...over,
    };
}

describe ( 'CondicoesPagamentoService', () =>
{
    let repo:        ReturnType < typeof MakeRepo >;
    let parcelasRepo: ReturnType < typeof MakeParcelasRepo >;
    let formasRepo:  ReturnType < typeof MakeFormasRepo >;
    let service:     CondicoesPagamentoService;

    beforeEach ( () =>
    {
        repo         = MakeRepo();
        parcelasRepo = MakeParcelasRepo();
        formasRepo   = MakeFormasRepo();
        service      = new CondicoesPagamentoService ( repo as never, parcelasRepo as never, formasRepo as never );
    });

    it ( 'FindCondicao lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindCondicao ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateCondicao delega ao repo dentro da transação', async () =>
    {
        const nova = { codCondDePag: 1, descricao: 'À Vista' };
        repo.Create.mockResolvedValue ( nova );

        const resultado = await service.CreateCondicao
        (
            { descricao: 'À Vista', juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0, parcelas: [] },
            1
        );

        expect ( repo.Create ).toHaveBeenCalledWith
        (
            { descricao: 'À Vista', juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0, parcelas: [] },
            1,
            {}
        );
        expect ( resultado ).toEqual ( nova );
    });

    it ( 'CreateCondicao cria cada parcela do array dentro da transação', async () =>
    {
        const nova = { codCondDePag: 5, descricao: 'Parcelado' };
        repo.Create.mockResolvedValue ( nova );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        parcelasRepo.Create.mockResolvedValue ( {} );

        const parcelas = [
            { numParcela: 1, codFormaDePag: 1, percentual: 50, numDias: 30, isActive: true },
            { numParcela: 2, codFormaDePag: 1, percentual: 50, numDias: 60, isActive: true },
        ];

        await service.CreateCondicao ( { descricao: 'Parcelado', juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0, parcelas }, 1 );

        expect ( parcelasRepo.Create ).toHaveBeenCalledTimes ( 2 );
        expect ( parcelasRepo.Create ).toHaveBeenCalledWith (
            { codCondDePag: 5, numParcela: 1, codFormaDePag: 1, percentual: 50, numDias: 30 },
            1,
            {}
        );
    });

    it ( 'CreateCondicao lança 400 quando codFormaDePag não existe', async () =>
    {
        repo.Create.mockResolvedValue ( { codCondDePag: 5 } );
        formasRepo.FindById.mockResolvedValue ( null );

        await expect (
            service.CreateCondicao (
                {
                    descricao: 'X',
                    juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                    parcelas:  [ { numParcela: 1, codFormaDePag: 99, percentual: 100, numDias: 1, isActive: true } ],
                },
                1
            )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( parcelasRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'UpdateCondicao lança 404 quando não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect (
            service.UpdateCondicao ( 99, { descricao: 'X', isActive: true, parcelas: [] }, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'UpdateCondicao retorna atualizado quando existe (sem parcelas)', async () =>
    {
        const atualizada = { codCondDePag: 1, descricao: 'Parcelado' };
        repo.Update.mockResolvedValue ( atualizada );
        parcelasRepo.List.mockResolvedValue ( [] );

        const resultado = await service.UpdateCondicao
        (
            1,
            { descricao: 'Parcelado', isActive: true, parcelas: [] },
            1
        );

        expect ( resultado ).toEqual ( atualizada );
    });

    it ( 'UpdateCondicao atualiza parcela existente quando o numParcela já existe na condição', async () =>
    {
        const atualizada = { codCondDePag: 1, descricao: 'Atualizada' };
        repo.Update.mockResolvedValue ( atualizada );
        parcelasRepo.List.mockResolvedValue
        ([
            { numParcela: 1, codFormaDePag: 1, percentual: '100.00', numDias: 0, isActive: true },
        ]);
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        parcelasRepo.Update.mockResolvedValue ( {} );

        await service.UpdateCondicao (
            1,
            {
                descricao: 'Atualizada',
                isActive:  true,
                parcelas:  [ { numParcela: 1, codFormaDePag: 1, percentual: 100, numDias: 1, isActive: true } ],
            },
            1
        );

        expect ( parcelasRepo.Update ).toHaveBeenCalledWith (
            1,
            1,
            { codFormaDePag: 1, percentual: 100, numDias: 1, isActive: true },
            1,
            {}
        );
        expect ( parcelasRepo.Create ).not.toHaveBeenCalled();
        expect ( parcelasRepo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'UpdateCondicao cria nova parcela quando o numParcela ainda não existe na condição', async () =>
    {
        repo.Update.mockResolvedValue ( { codCondDePag: 1 } );
        parcelasRepo.List.mockResolvedValue ( [] );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
        parcelasRepo.Create.mockResolvedValue ( {} );

        await service.UpdateCondicao (
            1,
            {
                descricao: 'X',
                isActive:  true,
                parcelas:  [ { numParcela: 1, codFormaDePag: 2, percentual: 100, numDias: 1, isActive: true } ],
            },
            1
        );

        expect ( parcelasRepo.Create ).toHaveBeenCalledTimes ( 1 );
        expect ( parcelasRepo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'UpdateCondicao faz soft delete de parcela ausente no array recebido', async () =>
    {
        repo.Update.mockResolvedValue ( { codCondDePag: 1 } );
        parcelasRepo.List.mockResolvedValue
        ([
            { numParcela: 2, codFormaDePag: 1, percentual: '100.00', numDias: 0, isActive: true },
        ]);
        parcelasRepo.Delete.mockResolvedValue ( { numParcela: 2 } );

        await service.UpdateCondicao
        (
            1,
            { descricao: 'X', isActive: true, parcelas: [] },
            1
        );

        expect ( parcelasRepo.Delete ).toHaveBeenCalledWith ( 1, 2, 1, {} );
    });

    it ( 'UpdateCondicao lança 400 quando forma de parcela não existe', async () =>
    {
        repo.Update.mockResolvedValue ( { codCondDePag: 1 } );
        parcelasRepo.List.mockResolvedValue ( [] );
        formasRepo.FindById.mockResolvedValue ( null );

        await expect (
            service.UpdateCondicao (
                1,
                {
                    descricao: 'X',
                    isActive:  true,
                    parcelas:  [ { numParcela: 1, codFormaDePag: 99, percentual: 100, numDias: 1, isActive: true } ],
                },
                1
            )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( parcelasRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'UpdateCondicao lança 409 quando há clientes ou compras vinculados (RN004 transversal)', async () =>
    {
        repo.HasExternalReferences.mockResolvedValue ( true );

        await expect (
            service.UpdateCondicao ( 1, { descricao: 'X', isActive: true, parcelas: [] }, 1 )
        ).rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'UpdateCondicao não bloqueia por causa das próprias parcelas (filho embutido)', async () =>
    {
        const atualizada = { codCondDePag: 1, descricao: 'Parcelado' };
        repo.HasExternalReferences.mockResolvedValue ( false );
        repo.Update.mockResolvedValue ( atualizada );
        parcelasRepo.List.mockResolvedValue
        ([
            { numParcela: 1, codFormaDePag: 1, percentual: '100.00', numDias: 0, isActive: true },
        ]);
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        parcelasRepo.Update.mockResolvedValue ( {} );

        const resultado = await service.UpdateCondicao (
            1,
            {
                descricao: 'Parcelado',
                isActive:  true,
                parcelas:  [ { numParcela: 1, codFormaDePag: 1, percentual: 100, numDias: 1, isActive: true } ],
            },
            1
        );

        expect ( resultado ).toEqual ( atualizada );
    });

    it ( 'DeleteCondicao lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteCondicao ( 99, 1 ) ).rejects.toMatchObject ( { status: 404 } );
        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteCondicao lança 409 quando há clientes ou compras vinculados', async () =>
    {
        repo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        repo.HasExternalReferences.mockResolvedValue ( true );

        await expect ( service.DeleteCondicao ( 1, 1 ) ).rejects.toMatchObject ( { status: 409 } );
        expect ( parcelasRepo.Delete ).not.toHaveBeenCalled();
        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteCondicao remove as parcelas da condição e depois a própria condição', async () =>
    {
        repo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        repo.HasExternalReferences.mockResolvedValue ( false );
        parcelasRepo.List.mockResolvedValue ( [ { numParcela: 1 }, { numParcela: 2 } ] );
        parcelasRepo.Delete.mockResolvedValue ( { numParcela: 1 } );
        repo.Delete.mockResolvedValue ( { codCondDePag: 1 } );

        await service.DeleteCondicao ( 1, 1 );

        expect ( parcelasRepo.List ).toHaveBeenCalledWith ( 999, 0, 1, {} );
        expect ( parcelasRepo.Delete ).toHaveBeenCalledWith ( 1, 1, 1, {} );
        expect ( parcelasRepo.Delete ).toHaveBeenCalledWith ( 1, 2, 1, {} );
        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 1, {} );
    });
});
