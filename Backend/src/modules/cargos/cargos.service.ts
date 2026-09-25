import { AppError } from '../../shared/errors/AppError';
import { CargosRepository } from './cargos.repository';
import type { CreateCargoInput, UpdateCargoInput } from './cargos.schema';

export class CargosService
{
    constructor
    (
        private readonly repo:
            CargosRepository = new CargosRepository()
    )
    {};

    async ListCargos
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindCargo ( id: number )
    {
        const cargo = await this.repo.FindById ( id );

        if ( !cargo )
        {
            throw new AppError ( 'Cargo não encontrado.', 404 );
        }

        return cargo;
    };

    async CreateCargo
    (
        data:    CreateCargoInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateCargo
    (
        id:      number,
        data:    UpdateCargoInput,
        codUser: number
    )
    {
        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível editar: há funcionários vinculados a este cargo.',
                409
            );
        };

        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Cargo não encontrado.', 404 );
        };

        return atualizado;
    };

    async DeleteCargo
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Cargo não encontrado.', 404 );
        };

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há funcionários vinculados a este cargo.',
                409
            );
        };

        await this.repo.Delete ( id, codUser );
    };
}
