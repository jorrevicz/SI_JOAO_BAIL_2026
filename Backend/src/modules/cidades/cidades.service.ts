import { AppError } from '../../shared/errors/AppError';
import { CidadesRepository } from './cidades.repository';
import { EstadosRepository } from '../estados/estados.repository';
import type { CreateCidadeInput, UpdateCidadeInput } from './cidades.schema';

export class CidadesService
{
    constructor
    (
        private readonly repo:       CidadesRepository  = new CidadesRepository(),
        private readonly estadosRepo: EstadosRepository = new EstadosRepository(),
    ) {}

    async ListCidades ( limit = 50, afterId = 0, codEstado?: number )
    {
        return this.repo.List ( limit, afterId, codEstado );
    }

    async FindCidades ( id: number )
    {
        const cidade = await this.repo.FindById ( id );

        if ( !cidade )
        {
            throw new AppError ( 'Cidade não encontrada.', 404 );
        }

        return cidade;
    }

    async CreateCidade ( data: CreateCidadeInput, codUser: number )
    {
        await this.AssertEstado ( data.codEstado );

        return this.repo.Create ( data, codUser );
    }

    async UpdateCidade ( id: number, data: UpdateCidadeInput, codUser: number )
    {
        await this.AssertEstado ( data.codEstado );

        const atualizada = await this.repo.Update ( id, data, codUser );

        if ( !atualizada )
        {
            throw new AppError ( 'Cidade não encontrada.', 404 );
        }

        return atualizada;
    }

    async DeleteCidade ( id: number, codUser: number )
    {
        if ( !( await this.repo.FindById ( id ) ) )
        {
            throw new AppError ( 'Cidade não encontrada.', 404 );
        }

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há clientes, fornecedores ou transportadoras vinculados a esta cidade.',
                409
            );
        }

        await this.repo.Delete ( id, codUser );
    }

    private async AssertEstado ( codEstado: number )
    {
        if ( !( await this.estadosRepo.FindById ( codEstado ) ) )
        {
            throw new AppError ( 'Estado informado não existe.', 400 );
        }
    }
}
