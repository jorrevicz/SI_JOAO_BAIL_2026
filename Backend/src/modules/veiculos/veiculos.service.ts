import { AppError } from '../../shared/errors/AppError';
import { VeiculosRepository } from './veiculos.repository';
import type { CreateVeiculoInput, UpdateVeiculoInput } from './veiculos.schema';

export class VeiculosService
{
    constructor
    (
        private readonly repo:
            VeiculosRepository = new VeiculosRepository()
    ) {};

    async ListVeiculos
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindVeiculo ( id: number )
    {
        const veiculo = await this.repo.FindById ( id );

        if ( !veiculo )
        {
            throw new AppError ( 'Veículo não encontrado.', 404 );
        }

        return veiculo;
    };

    async CreateVeiculo
    (
        data:    CreateVeiculoInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateVeiculo
    (
        id:      number,
        data:    UpdateVeiculoInput,
        codUser: number
    )
    {
        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Veículo não encontrado.', 404 );
        }

        return atualizado;
    };

    async DeleteVeiculo
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Veículo não encontrado.', 404 );
        }

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há transportadoras ou notas fiscais vinculadas a este veículo.',
                409
            );
        }

        await this.repo.Delete ( id, codUser );
    };
}
