import { AppError } from '../../shared/errors/AppError';
import { PecasRepository } from './pecas.repository';
import type { CreatePecaInput, UpdatePecaInput } from './pecas.schema';

export class PecasService
{
    constructor
    (
        private readonly repo:
            PecasRepository = new PecasRepository()
    )
    {};

    async ListPecas
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindPeca ( id: number )
    {
        const peca = await this.repo.FindById ( id );

        if ( !peca )
        {
            throw new AppError ( 'Peça não encontrada.', 404 );
        }

        return peca;
    };

    async CreatePeca
    (
        data:    CreatePecaInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdatePeca
    (
        id:      number,
        data:    UpdatePecaInput,
        codUser: number
    )
    {
        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível editar: há orçamentos ou substituições de Ordem de Serviço vinculados a esta peça.',
                409
            );
        };

        const atualizada = await this.repo.Update ( id, data, codUser );

        if ( !atualizada )
        {
            throw new AppError ( 'Peça não encontrada.', 404 );
        };

        return atualizada;
    };

    async DeletePeca
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Peça não encontrada.', 404 );
        };

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há orçamentos ou substituições de Ordem de Serviço vinculados a esta peça.',
                409
            );
        };

        await this.repo.Delete ( id, codUser );
    };
}
