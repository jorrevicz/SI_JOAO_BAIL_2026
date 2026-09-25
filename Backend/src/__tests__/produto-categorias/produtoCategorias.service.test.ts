import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProdutoCategoriasService } from '../../modules/produto-categorias/produtoCategorias.service';

function MakeVinculosRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return { List: vi.fn(), FindPair: vi.fn(), Create: vi.fn(), Delete: vi.fn(), ...over };
}

function MakeProdutosRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return { FindById: vi.fn(), ...over };
}

function MakeCategoriasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return { FindById: vi.fn(), ...over };
}

const PAYLOAD_VALIDO = { codProduto: 1, codCategoria: 1 };

describe ( 'ProdutoCategoriasService', () =>
{
    let repo:           ReturnType < typeof MakeVinculosRepo >;
    let produtosRepo:   ReturnType < typeof MakeProdutosRepo >;
    let categoriasRepo: ReturnType < typeof MakeCategoriasRepo >;
    let service:        ProdutoCategoriasService;

    beforeEach ( () =>
    {
        repo           = MakeVinculosRepo();
        produtosRepo   = MakeProdutosRepo();
        categoriasRepo = MakeCategoriasRepo();
        service        = new ProdutoCategoriasService ( repo as never, produtosRepo as never, categoriasRepo as never );
    });

    it ( 'ListVinculos delega ao repo', async () =>
    {
        repo.List.mockResolvedValue ( [] );

        await service.ListVinculos ( 50, 0, 1 );

        expect ( repo.List ).toHaveBeenCalledWith ( 50, 0, 1 );
    });

    it ( 'CreateVinculo lança 400 quando o produto não existe', async () =>
    {
        produtosRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.CreateVinculo ( PAYLOAD_VALIDO )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( repo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateVinculo lança 400 quando a categoria não existe', async () =>
    {
        produtosRepo.FindById.mockResolvedValue ( { codProd: 1 } );
        categoriasRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.CreateVinculo ( PAYLOAD_VALIDO )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( repo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateVinculo lança 409 quando o vínculo já existe', async () =>
    {
        produtosRepo.FindById.mockResolvedValue ( { codProd: 1 } );
        categoriasRepo.FindById.mockResolvedValue ( { codCategoria: 1 } );
        repo.FindPair.mockResolvedValue ( { codProduto: 1, codCategoria: 1 } );

        await expect
        (
            service.CreateVinculo ( PAYLOAD_VALIDO )
        ).rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateVinculo delega ao repo quando produto, categoria e par são válidos', async () =>
    {
        produtosRepo.FindById.mockResolvedValue ( { codProd: 1 } );
        categoriasRepo.FindById.mockResolvedValue ( { codCategoria: 1 } );
        repo.FindPair.mockResolvedValue ( null );
        repo.Create.mockResolvedValue ( PAYLOAD_VALIDO );

        await service.CreateVinculo ( PAYLOAD_VALIDO );

        expect ( repo.Create ).toHaveBeenCalledWith ( 1, 1 );
    });

    it ( 'DeleteVinculo lança 404 quando o vínculo não existe', async () =>
    {
        repo.Delete.mockResolvedValue ( null );

        await expect ( service.DeleteVinculo ( 1, 1 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteVinculo remove quando o vínculo existe', async () =>
    {
        repo.Delete.mockResolvedValue ( { codProduto: 1, codCategoria: 1 } );

        await service.DeleteVinculo ( 1, 1 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 1 );
    });
});
