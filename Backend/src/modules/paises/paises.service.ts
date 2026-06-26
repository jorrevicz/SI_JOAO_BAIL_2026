import { AppError } from '../../shared/errors/AppError';
import { PaisesRepository } from './paises.repository';
import type { CreatePaisInput, UpdatePaisInput } from './paises.schema';

export class PaisesService 
{
    constructor
    (
        private readonly repo:
            PaisesRepository = new PaisesRepository()
    ) 
    {};

    async ListPaises
    (
        limit = 50, 
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindPaises ( id: number )
    {
        const pais = await this.repo.FindById ( id );

        if ( !pais )
        {
            throw new AppError ( 'País não encontrado.', 404 );
        }

        return pais;
    };

    async CreatePais
    (
        data: CreatePaisInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdatePais
    (
        id: number,
        data: UpdatePaisInput,
        codUser:number
    )
    {
        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'País não encontrado', 404 );
        };

        return atualizado;
    };

    async DeletePais
    (
        id: number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'País não encontrado.', 404 );
        };

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há estados vinculados a este país.', 
                409
            );
        };

        await this.repo.Delete ( id, codUser );
    };
}
