import { AppError } from '../../shared/errors/AppError';
import { TransportadorasRepository } from './transportadoras.repository';
import type { CreateTransportadoraInput, UpdateTransportadoraInput } from './transportadoras.schema';

export class TransportadorasService
{
    constructor
    (
        private readonly repo:
            TransportadorasRepository = new TransportadorasRepository()
    ) {};

    async ListTransportadoras
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindTransportadora ( id: number )
    {
        const transportadora = await this.repo.FindById ( id );

        if ( !transportadora )
        {
            throw new AppError ( 'Transportadora não encontrada.', 404 );
        }

        return transportadora;
    };

    async CreateTransportadora
    (
        data:    CreateTransportadoraInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateTransportadora
    (
        id:      number,
        data:    UpdateTransportadoraInput,
        codUser: number
    )
    {
        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível editar: há compras ou notas fiscais vinculadas a esta transportadora.',
                409
            );
        }

        const atualizada = await this.repo.Update ( id, data, codUser );

        if ( !atualizada )
        {
            throw new AppError ( 'Transportadora não encontrada.', 404 );
        }

        return atualizada;
    };

    async DeleteTransportadora
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Transportadora não encontrada.', 404 );
        }

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há compras ou notas fiscais vinculadas a esta transportadora.',
                409
            );
        }

        await this.repo.Delete ( id, codUser );
    };
}
