import { AppError } from '../../shared/errors/AppError';
import { FuncionariosRepository } from './funcionarios.repository';
import type { CreateFuncionarioInput, UpdateFuncionarioInput } from './funcionarios.schema';

export class FuncionariosService
{
    constructor
    (
        private readonly repo:
            FuncionariosRepository = new FuncionariosRepository()
    )
    {};

    async ListFuncionarios
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindFuncionario ( id: number )
    {
        const funcionario = await this.repo.FindById ( id );

        if ( !funcionario )
        {
            throw new AppError ( 'Funcionário não encontrado.', 404 );
        }

        return funcionario;
    };

    async CreateFuncionario
    (
        data:    CreateFuncionarioInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateFuncionario
    (
        id:      number,
        data:    UpdateFuncionarioInput,
        codUser: number
    )
    {
        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível editar: há serviços vinculados a este funcionário.',
                409
            );
        };

        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Funcionário não encontrado.', 404 );
        };

        return atualizado;
    };

    async DeleteFuncionario
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Funcionário não encontrado.', 404 );
        };

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há serviços vinculados a este funcionário.',
                409
            );
        };

        await this.repo.Delete ( id, codUser );
    };
}
