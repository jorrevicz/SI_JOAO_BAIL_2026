import { AppError } from '../../shared/errors/AppError';
import { FormasPagamentoRepository } from './formasPagamento.repository';
import type { CreateFormaPagamentoInput, UpdateFormaPagamentoInput } from './formasPagamento.schema';

export class FormasPagamentoService
{
    constructor
    (
        private readonly repo: FormasPagamentoRepository = new FormasPagamentoRepository(),
    ) {}

    async ListFormas ( limit = 50, afterId = 0 )
    {
        return this.repo.List ( limit, afterId );
    }

    async FindForma ( id: number )
    {
        const forma = await this.repo.FindById ( id );

        if ( !forma )
        {
            throw new AppError ( 'Forma de pagamento não encontrada.', 404 );
        }

        return forma;
    }

    async CreateForma ( data: CreateFormaPagamentoInput, codUser: number )
    {
        return this.repo.Create ( data, codUser );
    }

    async UpdateForma ( id: number, data: UpdateFormaPagamentoInput, codUser: number )
    {
        const atualizada = await this.repo.Update ( id, data, codUser );

        if ( !atualizada )
        {
            throw new AppError ( 'Forma de pagamento não encontrada.', 404 );
        }

        return atualizada;
    }

    async DeleteForma ( id: number, codUser: number )
    {
        if ( !( await this.repo.FindById ( id ) ) )
        {
            throw new AppError ( 'Forma de pagamento não encontrada.', 404 );
        }

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há parcelas ou contas a receber vinculadas a esta forma de pagamento.',
                409
            );
        }

        await this.repo.Delete ( id, codUser );
    }
}
