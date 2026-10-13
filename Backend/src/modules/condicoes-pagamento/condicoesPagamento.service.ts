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
                        numParcela:    item.numParcela,
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
            if ( await this.repo.HasExternalReferences ( id, transaction ) )
            {
                throw new AppError
                (
                    'Não é possível editar: há clientes ou compras vinculados a esta condição.',
                    409
                );
            }

            const atualizada = await this.repo.Update ( id, data, codUser, transaction );

            if ( !atualizada )
            {
                throw new AppError ( 'Condição de pagamento não encontrada.', 404 );
            }

            const parcelasExistentes = await this.parcelasRepo.List ( 999, 0, id, transaction );
            const numerosExistentes  = new Set ( parcelasExistentes.map ( ( existente ) => Number ( existente.numParcela ) ) );
            const numerosRecebidos   = new Set ( data.parcelas.map ( ( item ) => item.numParcela ) );

            for ( const existente of parcelasExistentes )
            {
                if ( !numerosRecebidos.has ( Number ( existente.numParcela ) ) )
                {
                    await this.parcelasRepo.Delete ( id, Number ( existente.numParcela ), codUser, transaction );
                }
            }

            for ( const item of data.parcelas )
            {
                const forma = await this.formasRepo.FindById ( item.codFormaDePag, transaction );

                if ( !forma )
                {
                    throw new AppError ( 'Forma de pagamento informada não existe.', 400 );
                }

                if ( numerosExistentes.has ( item.numParcela ) )
                {
                    await this.parcelasRepo.Update (
                        id,
                        item.numParcela,
                        {
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
                            numParcela:    item.numParcela,
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
        return WithTransaction ( async ( transaction ) =>
        {
            if ( !( await this.repo.FindById ( id, transaction ) ) )
            {
                throw new AppError ( 'Condição de pagamento não encontrada.', 404 );
            }

            // Parcelas não existem sem a condição: não bloqueiam a exclusão, são removidas junto.
            if ( await this.repo.HasExternalReferences ( id, transaction ) )
            {
                throw new AppError
                (
                    'Não é possível excluir: há clientes ou compras vinculados a esta condição.',
                    409
                );
            }

            const parcelas = await this.parcelasRepo.List ( 999, 0, id, transaction );

            for ( const parcela of parcelas )
            {
                await this.parcelasRepo.Delete ( id, Number ( parcela.numParcela ), codUser, transaction );
            }

            await this.repo.Delete ( id, codUser, transaction );
        } );
    }
}
