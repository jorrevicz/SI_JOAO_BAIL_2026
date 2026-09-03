import { AppError } from '../../shared/errors/AppError';
import { ClientesRepository } from './clientes.repository';
import type { CreateClienteInput, UpdateClienteInput } from './clientes.schema';

export class ClientesService
{
    constructor
    (
        private readonly repo:
            ClientesRepository = new ClientesRepository()
    ) {};

    async ListClientes
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindCliente ( id: number )
    {
        const cliente = await this.repo.FindById ( id );

        if ( !cliente )
        {
            throw new AppError ( 'Cliente não encontrado.', 404 );
        }

        return cliente;
    };

    async CreateCliente
    (
        data:    CreateClienteInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateCliente
    (
        id:      number,
        data:    UpdateClienteInput,
        codUser: number
    )
    {
        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Cliente não encontrado.', 404 );
        }

        return atualizado;
    };

    async DeleteCliente
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Cliente não encontrado.', 404 );
        }

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há contas a receber vinculadas a este cliente.',
                409
            );
        }

        await this.repo.Delete ( id, codUser );
    };
}
