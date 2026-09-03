import { AppError } from '../../shared/errors/AppError';
import { FornecedoresRepository } from './fornecedores.repository';
import type { CreateFornecedorInput, UpdateFornecedorInput } from './fornecedores.schema';

export class FornecedoresService
{
    constructor
    (
        private readonly repo:
            FornecedoresRepository = new FornecedoresRepository()
    ) {};

    async ListFornecedores
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindFornecedor ( id: number )
    {
        const fornecedor = await this.repo.FindById ( id );

        if ( !fornecedor )
        {
            throw new AppError ( 'Fornecedor não encontrado.', 404 );
        }

        return fornecedor;
    };

    async CreateFornecedor
    (
        data:    CreateFornecedorInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateFornecedor
    (
        id:      number,
        data:    UpdateFornecedorInput,
        codUser: number
    )
    {
        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Fornecedor não encontrado.', 404 );
        }

        return atualizado;
    };

    async DeleteFornecedor
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Fornecedor não encontrado.', 404 );
        }

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há compras, contas ou notas fiscais vinculadas a este fornecedor.',
                409
            );
        }

        await this.repo.Delete ( id, codUser );
    };
}
