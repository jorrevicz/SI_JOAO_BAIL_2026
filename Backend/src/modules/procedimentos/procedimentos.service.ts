import { AppError } from '../../shared/errors/AppError';
import { ProcedimentosRepository } from './procedimentos.repository';
import type { CreateProcedimentoInput, UpdateProcedimentoInput } from './procedimentos.schema';

export class ProcedimentosService
{
    constructor
    (
        private readonly repo:
            ProcedimentosRepository = new ProcedimentosRepository()
    )
    {};

    async ListProcedimentos
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindProcedimento ( id: number )
    {
        const procedimento = await this.repo.FindById ( id );

        if ( !procedimento )
        {
            throw new AppError ( 'Procedimento não encontrado.', 404 );
        }

        return procedimento;
    };

    async CreateProcedimento
    (
        data:    CreateProcedimentoInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateProcedimento
    (
        id:      number,
        data:    UpdateProcedimentoInput,
        codUser: number
    )
    {
        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível editar: há checagens de Ordem de Serviço vinculadas a este procedimento.',
                409
            );
        };

        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Procedimento não encontrado.', 404 );
        };

        return atualizado;
    };

    async DeleteProcedimento
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Procedimento não encontrado.', 404 );
        };

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há checagens de Ordem de Serviço vinculadas a este procedimento.',
                409
            );
        };

        await this.repo.Delete ( id, codUser );
    };
}
