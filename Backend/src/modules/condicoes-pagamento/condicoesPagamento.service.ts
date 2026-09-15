import { AppError } from '../../shared/errors/AppError';
import { WithTransaction } from '../../shared/transaction/withTransaction';
import { CondicoesPagamentoRepository } from './condicoesPagamento.repository';
import { ParcelasRepository } from '../parcelas/parcelas.repository';
import { FormasPagamentoRepository } from '../formas-pagamento/formasPagamento.repository';
import type { CreateCondicaoPagamentoInput, UpdateCondicaoPagamentoInput } from './condicoesPagamento.schema';

export class CondicoesPagamentoService
{
    constructor
    (
        private readonly repo:        CondicoesPagamentoRepository = new CondicoesPagamentoRepository(),
        private readonly parcelasRepo: ParcelasRepository          = new ParcelasRepository(),
        private readonly formasRepo:  FormasPagamentoRepository    = new FormasPagamentoRepository(),
    ) {}

    async ListCondicoes ( limit = 50, afterId = 0 )
    {
        return this.repo.List ( limit, afterId );
    }

    async FindCondicao ( id: number )
    {
        const condicao = await this.repo.FindById ( id );

        if ( !condicao )
        {
            throw new AppError ( 'Condição de pagamento não encontrada.', 404 );
        }

        return condicao;
    }

    async CreateCondicao ( data: CreateCondicaoPagamentoInput, codUser: number )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const condicao = await this.repo.Create ( data, codUser, transaction );

            for ( const item of data.parcelas )
            {
                const forma = await this.formasRepo.FindById ( item.codFormaDePag, transaction );

                if ( !forma )
                {
                    throw new AppError ( 'Forma de pagamento informada não existe.', 400 );
                }

                await this.parcelasRepo.Create (
                    {
                        codCondDePag:  condicao.codCondDePag,
                        codFormaDePag: item.codFormaDePag,
                        percentual:    item.percentual,
                        numDias:       item.numDias,
                    },
                    codUser,
                    transaction
                );
            }

            return condicao;
        } );
    }

    async UpdateCondicao ( id: number, data: UpdateCondicaoPagamentoInput, codUser: number )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const atualizada = await this.repo.Update ( id, data, codUser, transaction );

            if ( !atualizada )
            {
                throw new AppError ( 'Condição de pagamento não encontrada.', 404 );
            }

            const parcelasExistentes = await this.parcelasRepo.List ( 999, 0, id, transaction );
            const idsParcRecebidas   = new Set (
                data.parcelas
                    .filter ( ( item ) => item.codParcela !== undefined )
                    .map    ( ( item ) => item.codParcela! )
            );

            for ( const existente of parcelasExistentes )
            {
                if ( !idsParcRecebidas.has ( existente.codParcela ) )
                {
                    await this.parcelasRepo.Delete ( existente.codParcela, codUser, transaction );
                }
            }

            for ( const item of data.parcelas )
            {
                const forma = await this.formasRepo.FindById ( item.codFormaDePag, transaction );

                if ( !forma )
                {
                    throw new AppError ( 'Forma de pagamento informada não existe.', 400 );
                }

                if ( item.codParcela !== undefined )
                {
                    await this.parcelasRepo.Update (
                        item.codParcela,
                        {
                            codCondDePag:  id,
                            codFormaDePag: item.codFormaDePag,
                            percentual:    item.percentual,
                            numDias:       item.numDias,
                            isActive:      true,
                        },
                        codUser,
                        transaction
                    );
                }
                else
                {
                    await this.parcelasRepo.Create (
                        {
                            codCondDePag:  id,
                            codFormaDePag: item.codFormaDePag,
                            percentual:    item.percentual,
                            numDias:       item.numDias,
                        },
                        codUser,
                        transaction
                    );
                }
            }

            return atualizada;
        } );
    }

    async DeleteCondicao ( id: number, codUser: number )
    {
        if ( !( await this.repo.FindById ( id ) ) )
        {
            throw new AppError ( 'Condição de pagamento não encontrada.', 404 );
        }

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: há parcelas, clientes ou compras vinculados a esta condição.',
                409
            );
        }

        await this.repo.Delete ( id, codUser );
    }
}
