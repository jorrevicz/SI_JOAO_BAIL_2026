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

    async ListParcelas ( limit = 50, afterNumParcela = 0, codCondDePag?: number, afterCodCondDePag = 0 )
    {
        return this.repo.List ( limit, afterNumParcela, codCondDePag, undefined, afterCodCondDePag );
    }

    async FindParcela ( codCondDePag: number, numParcela: number )
    {
        const parcela = await this.repo.FindById ( codCondDePag, numParcela );

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
        await this.AssertSequencia ( data.codCondDePag, data.numParcela, data.numDias );

        return this.repo.Create ( data, codUser );
    }

    async UpdateParcela ( codCondDePag: number, numParcela: number, data: UpdateParcelaInput, codUser: number )
    {
        await this.AssertForma ( data.codFormaDePag );
        await this.AssertSequencia ( codCondDePag, numParcela, data.numDias, numParcela );

        const atualizada = await this.repo.Update ( codCondDePag, numParcela, data, codUser );

        if ( !atualizada )
        {
            throw new AppError ( 'Parcela não encontrada.', 404 );
        }

        return atualizada;
    }

    async DeleteParcela ( codCondDePag: number, numParcela: number, codUser: number )
    {
        if ( !( await this.repo.FindById ( codCondDePag, numParcela ) ) )
        {
            throw new AppError ( 'Parcela não encontrada.', 404 );
        }

        await this.repo.Delete ( codCondDePag, numParcela, codUser );
    }

    /**
     * O número da parcela é informado manualmente (sem geração automática): não pode
     * repetir dentro da condição, e os dias precisam crescer junto com o número — a
     * parcela de número maior não pode ter dia menor (nem igual) ao da anterior.
     * `numParcelaAtual` é ignorado na comparação (edição de parcela existente).
     */
    private async AssertSequencia ( codCondDePag: number, numParcela: number, numDias: number, numParcelaAtual?: number )
    {
        const existentes = ( await this.repo.List ( 999, 0, codCondDePag ) )
            .filter ( ( parcela ) => Number ( parcela.numParcela ) !== numParcelaAtual );

        if ( existentes.some ( ( parcela ) => Number ( parcela.numParcela ) === numParcela ) )
        {
            throw new AppError ( 'Já existe uma parcela com este número nesta condição de pagamento.', 409 );
        }

        const anterior  = existentes.filter ( ( parcela ) => Number ( parcela.numParcela ) < numParcela ).at ( -1 );
        const posterior = existentes.find   ( ( parcela ) => Number ( parcela.numParcela ) > numParcela );

        if ( anterior && numDias <= anterior.numDias )
        {
            throw new AppError
            (
                `Os dias da parcela devem ser maiores que os da parcela anterior (${ anterior.numDias }).`,
                400
            );
        }

        if ( posterior && numDias >= posterior.numDias )
        {
            throw new AppError
            (
                `Os dias da parcela devem ser menores que os da parcela seguinte (${ posterior.numDias }).`,
                400
            );
        }
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
