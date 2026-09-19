import { AppError } from '../../shared/errors/AppError';
import { CategoriasRepository } from './categorias.repository';
import type { CreateCategoriaInput, UpdateCategoriaInput } from './categorias.schema';

export class CategoriasService
{
    constructor
    (
        private readonly repo:
            CategoriasRepository = new CategoriasRepository()
    )
    {};

    async ListCategorias
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindCategoria ( id: number )
    {
        const categoria = await this.repo.FindById ( id );

        if ( !categoria )
        {
            throw new AppError ( 'Categoria não encontrada.', 404 );
        }

        return categoria;
    };

    async CreateCategoria
    (
        data:    CreateCategoriaInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateCategoria
    (
        id:      number,
        data:    UpdateCategoriaInput,
        codUser: number
    )
    {
        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível editar: há produtos vinculados a esta categoria.',
                409
            );
        };

        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Categoria não encontrada.', 404 );
        };

        return atualizado;
    };

    async DeleteCategoria
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Categoria não encontrada.', 404 );
        };

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há produtos vinculados a esta categoria.',
                409
            );
        };

        await this.repo.Delete ( id, codUser );
    };
}
