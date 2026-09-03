import { AppError } from '../../shared/errors/AppError';
import { ParcelasRepository } from './parcelas.repository';
import { CondicoesPagamentoRepository } from '../condicoes-pagamento/condicoesPagamento.repository';
import { FormasPagamentoRepository } from '../formas-pagamento/formasPagamento.repository';
import type { CreateParcelaInput, UpdateParcelaInput } from './parcelas.schema';

export class ParcelasService
{
    constructor
    (
        private readonly repo:          ParcelasRepository           = new ParcelasRepository(),
        private readonly condicoesRepo: CondicoesPagamentoRepository = new CondicoesPagamentoRepository(),
        private readonly formasRepo:    FormasPagamentoRepository    = new FormasPagamentoRepository(),
    ) {}

    async ListParcelas ( limit = 50, afterId = 0, codCondDePag?: number )
    {
        return this.repo.List ( limit, afterId, codCondDePag );
    }

    async FindParcela ( id: number )
    {
        const parcela = await this.repo.FindById ( id );

        if ( !parcela )
        {
            throw new AppError ( 'Parcela não encontrada.', 404 );
        }

        return parcela;
    }

    async CreateParcela ( data: CreateParcelaInput, codUser: number )
    {
        await this.AssertCondicao ( data.codCondDePag );
        await this.AssertForma    ( data.codFormaDePag );

        return this.repo.Create ( data, codUser );
    }

    async UpdateParcela ( id: number, data: UpdateParcelaInput, codUser: number )
    {
        await this.AssertCondicao ( data.codCondDePag );
        await this.AssertForma    ( data.codFormaDePag );

        const atualizada = await this.repo.Update ( id, data, codUser );

        if ( !atualizada )
        {
            throw new AppError ( 'Parcela não encontrada.', 404 );
        }

        return atualizada;
    }

    async DeleteParcela ( id: number, codUser: number )
    {
        if ( !( await this.repo.FindById ( id ) ) )
        {
            throw new AppError ( 'Parcela não encontrada.', 404 );
        }

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há contas a pagar vinculadas a esta parcela.',
                409
            );
        }

        await this.repo.Delete ( id, codUser );
    }

    private async AssertCondicao ( codCondDePag: number )
    {
        if ( !( await this.condicoesRepo.FindById ( codCondDePag ) ) )
        {
            throw new AppError ( 'Condição de pagamento informada não existe.', 400 );
        }
    }

    private async AssertForma ( codFormaDePag: number )
    {
        if ( !( await this.formasRepo.FindById ( codFormaDePag ) ) )
        {
            throw new AppError ( 'Forma de pagamento informada não existe.', 400 );
        }
    }
}
