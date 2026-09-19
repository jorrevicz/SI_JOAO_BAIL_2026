import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContasPagamentoService } from '../../modules/contas-pagamento/contas-pagamento.service';
import type { ContaAPagarId } from '../../modules/contas-pagamento/contas-pagamento.repository';

const ID_TESTE: ContaAPagarId = { numero: '00000001', modelo: '01', serie: '01', parcela: 1 };

function MakeRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        List:            vi.fn(),
        FindById:        vi.fn(),
        ExisteDocumento: vi.fn(),
        Create:          vi.fn(),
        Update:          vi.fn(),
        RegistrarBaixa:  vi.fn(),
        Cancelar:        vi.fn(),
        Delete:          vi.fn(),
        ...over,
    };
}

function MakeFornecedoresRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        FindById: vi.fn(),
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

describe ( 'ContasPagamentoService', () =>
{
    let repo:             ReturnType < typeof MakeRepo >;
    let fornecedoresRepo: ReturnType < typeof MakeFornecedoresRepo >;
    let formasRepo:       ReturnType < typeof MakeFormasRepo >;
    let service:          ContasPagamentoService;

    beforeEach ( () =>
    {
        repo             = MakeRepo();
        fornecedoresRepo = MakeFornecedoresRepo();
        formasRepo       = MakeFormasRepo();
        service          = new ContasPagamentoService ( repo as never, fornecedoresRepo as never, formasRepo as never );
    });

    describe ( 'FindConta', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect ( service.FindConta ( ID_TESTE ) ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'retorna a conta quando existe', async () =>
        {
            const conta = { ...ID_TESTE, codFornecedor: 1 };
            repo.FindById.mockResolvedValue ( conta );

            await expect ( service.FindConta ( ID_TESTE ) ).resolves.toEqual ( conta );
        });
    });

    describe ( 'CreateConta', () =>
    {
        const dados = { ...ID_TESTE, codFornecedor: 1, codFormaDePag: 2 } as never;

        it ( 'lança 400 quando o fornecedor informado não existe', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( null );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'lança 400 quando a forma de pagamento informada não existe', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
            formasRepo.FindById.mockResolvedValue ( null );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'lança 409 quando já existe um documento com este número, modelo e série', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.ExisteDocumento.mockResolvedValue ( true );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'delega ao repositório quando fornecedor e forma de pagamento existem e o documento é inédito', async () =>
        {
            const criada = { ...ID_TESTE, codFornecedor: 1 };
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.ExisteDocumento.mockResolvedValue ( false );
            repo.Create.mockResolvedValue ( criada );

            const resultado = await service.CreateConta ( dados, 1 );

            expect ( repo.ExisteDocumento ).toHaveBeenCalledWith
            (
                { numero: ID_TESTE.numero, modelo: ID_TESTE.modelo, serie: ID_TESTE.serie }
            );
            expect ( repo.Create ).toHaveBeenCalledWith ( dados, 1 );
            expect ( resultado ).toEqual ( criada );
        });
    });

    describe ( 'UpdateConta', () =>
    {
        const dados = { ...ID_TESTE, codFornecedor: 1, codFormaDePag: 2, isActive: true } as never;

        it ( 'lança 400 quando o fornecedor informado não existe', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( null );

            await expect ( service.UpdateConta ( ID_TESTE, dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Update ).not.toHaveBeenCalled();
        });

        it ( 'lança 400 quando a forma de pagamento informada não existe', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
            formasRepo.FindById.mockResolvedValue ( null );

            await expect ( service.UpdateConta ( ID_TESTE, dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Update ).not.toHaveBeenCalled();
        });

        it ( 'lança 404 quando a conta não existe', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.Update.mockResolvedValue ( null );

            await expect ( service.UpdateConta ( ID_TESTE, dados, 1 ) ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'retorna a conta atualizada quando existe', async () =>
        {
            const atualizada = { ...ID_TESTE, codFornecedor: 1 };
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.Update.mockResolvedValue ( atualizada );

            await expect ( service.UpdateConta ( ID_TESTE, dados, 1 ) ).resolves.toEqual ( atualizada );
        });
    });

    describe ( 'RegistrarBaixa', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect (
                service.RegistrarBaixa ( ID_TESTE, '100.00', new Date(), 1 )
            ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'lança 409 quando a conta já foi baixada', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa: new Date(), justificativaCancelamento: null } );

            await expect (
                service.RegistrarBaixa ( ID_TESTE, '100.00', new Date(), 1 )
            ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.RegistrarBaixa ).not.toHaveBeenCalled();
        });

        it ( 'lança 409 quando a conta está cancelada', async () =>
        {
            repo.FindById.mockResolvedValue
            ({
                ...ID_TESTE,
                valorBaixa: null,
                dtBaixa: null,
                justificativaCancelamento: 'Pedido de compra cancelado',
            });

            await expect (
                service.RegistrarBaixa ( ID_TESTE, '100.00', new Date(), 1 )
            ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.RegistrarBaixa ).not.toHaveBeenCalled();
        });

        it ( 'registra a baixa quando a conta está em aberto', async () =>
        {
            const dtBaixa = new Date();
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: null, dtBaixa: null, justificativaCancelamento: null } );
            repo.RegistrarBaixa.mockResolvedValue ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa } );

            const resultado = await service.RegistrarBaixa ( ID_TESTE, '100.00', dtBaixa, 1 );

            expect ( repo.RegistrarBaixa ).toHaveBeenCalledWith ( ID_TESTE, '100.00', dtBaixa, 1 );
            expect ( resultado ).toEqual ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa } );
        });
    });

    describe ( 'CancelarConta', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect (
                service.CancelarConta ( ID_TESTE, 'Compra cancelada', 1 )
            ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'lança 409 quando a conta já foi baixada', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa: new Date() } );

            await expect (
                service.CancelarConta ( ID_TESTE, 'Compra cancelada', 1 )
            ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.Cancelar ).not.toHaveBeenCalled();
        });

        it ( 'cancela a conta quando ainda não foi baixada', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: null, dtBaixa: null } );
            repo.Cancelar.mockResolvedValue ( { ...ID_TESTE, justificativaCancelamento: 'Compra cancelada' } );

            const resultado = await service.CancelarConta ( ID_TESTE, 'Compra cancelada', 1 );

            expect ( repo.Cancelar ).toHaveBeenCalledWith ( ID_TESTE, 'Compra cancelada', 1 );
            expect ( resultado ).toEqual ( { ...ID_TESTE, justificativaCancelamento: 'Compra cancelada' } );
        });
    });

    describe ( 'DeleteConta', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect ( service.DeleteConta ( ID_TESTE, 1 ) ).rejects.toMatchObject ( { status: 404 } );
            expect ( repo.Delete ).not.toHaveBeenCalled();
        });

        it ( 'remove a conta quando ela existe', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE } );
            repo.Delete.mockResolvedValue ( ID_TESTE );

            await service.DeleteConta ( ID_TESTE, 1 );

            expect ( repo.Delete ).toHaveBeenCalledWith ( ID_TESTE, 1 );
        });
    });
});
