import { AppError } from '../../shared/errors/AppError';
import { ServicosRepository } from './servicos.repository';
import type { CreateServicoInput, UpdateServicoInput } from './servicos.schema';

export class ServicosService
{
    constructor
    (
        private readonly repo:
            ServicosRepository = new ServicosRepository()
    )
    {};

    async ListServicos
    (
        limit  = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindServico ( id: number )
    {
        const servico = await this.repo.FindById ( id );

        if ( !servico )
        {
            throw new AppError ( 'Serviço não encontrado.', 404 );
        }

        return servico;
    };

    async CreateServico
    (
        data:    CreateServicoInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateServico
    (
        id:      number,
        data:    UpdateServicoInput,
        codUser: number
    )
    {
        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível editar: há execuções de Ordem de Serviço vinculadas a este serviço.',
                409
            );
        };

        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Serviço não encontrado.', 404 );
        };

        return atualizado;
    };

    async DeleteServico
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Serviço não encontrado.', 404 );
        };

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há execuções de Ordem de Serviço vinculadas a este serviço.',
                409
            );
        };

        await this.repo.Delete ( id, codUser );
    };
}
