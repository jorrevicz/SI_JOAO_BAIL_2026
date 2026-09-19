import { AppError } from '../../shared/errors/AppError';
import { ContasReceberRepository } from './contas-receber.repository';
import type { ContaAReceberId } from './contas-receber.repository';
import { ClientesRepository } from '../clientes/clientes.repository';
import { FormasPagamentoRepository } from '../formas-pagamento/formasPagamento.repository';
import { ValidarDocumentoFiscalInexistente } from '../../shared/documento-fiscal/documentoFiscal.service';
import type { CreateContasAReceberInput, UpdateContasAReceberInput } from './contas-receber.schema';

export class ContasReceberService
{
    constructor
    (
        private readonly repo:          ContasReceberRepository   = new ContasReceberRepository(),
        private readonly clientesRepo:  ClientesRepository         = new ClientesRepository(),
        private readonly formasRepo:    FormasPagamentoRepository  = new FormasPagamentoRepository(),
    ) {}

    async ListContas ( limit = 50, afterCursor?: ContaAReceberId )
    {
        return this.repo.List ( limit, afterCursor );
    }

    async FindConta ( id: ContaAReceberId )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a receber não encontrada.', 404 );
        }

        return conta;
    }

    async CreateConta ( data: CreateContasAReceberInput, codUser: number )
    {
        const cliente = await this.clientesRepo.FindById ( data.codCliente );

        if ( !cliente )
        {
            throw new AppError ( 'Cliente informado não existe.', 400 );
        }

        const forma = await this.formasRepo.FindById ( data.codFormaDePag );

        if ( !forma )
        {
            throw new AppError ( 'Forma de pagamento informada não existe.', 400 );
        }

        await ValidarDocumentoFiscalInexistente
        (
            { numero: data.numero, modelo: data.modelo, serie: data.serie },
            ( chave ) => this.repo.ExisteDocumento ( chave )
        );

        return this.repo.Create ( data, codUser );
    }

    async UpdateConta ( id: ContaAReceberId, data: UpdateContasAReceberInput, codUser: number )
    {
        const cliente = await this.clientesRepo.FindById ( data.codCliente );

        if ( !cliente )
        {
            throw new AppError ( 'Cliente informado não existe.', 400 );
        }

        const forma = await this.formasRepo.FindById ( data.codFormaDePag );

        if ( !forma )
        {
            throw new AppError ( 'Forma de pagamento informada não existe.', 400 );
        }

        const atualizada = await this.repo.Update ( id, data, codUser );

        if ( !atualizada )
        {
            throw new AppError ( 'Conta a receber não encontrada.', 404 );
        }

        return atualizada;
    }

    async RegistrarPagamentoRecebido ( id: ContaAReceberId, valorBaixa: string, dtBaixa: Date, dtPagamento: Date, codUser: number )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a receber não encontrada.', 404 );
        }

        if ( conta.valorBaixa !== null || conta.dtBaixa !== null || conta.dtPagamento !== null )
        {
            throw new AppError ( 'Esta conta a receber já foi baixada.', 409 );
        }

        if ( conta.justificativaCancelamento !== null )
        {
            throw new AppError ( 'Não é possível baixar uma conta a receber cancelada.', 409 );
        }

        return this.repo.RegistrarPagamentoRecebido ( id, valorBaixa, dtBaixa, dtPagamento, codUser );
    }

    async CancelarConta ( id: ContaAReceberId, justificativaCancelamento: string, codUser: number )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a receber não encontrada.', 404 );
        }

        if ( conta.valorBaixa !== null || conta.dtBaixa !== null || conta.dtPagamento !== null )
        {
            throw new AppError ( 'Não é possível cancelar uma conta a receber já baixada.', 409 );
        }

        return this.repo.Cancelar ( id, justificativaCancelamento, codUser );
    }

    async DeleteConta ( id: ContaAReceberId, codUser: number )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a receber não encontrada.', 404 );
        }

        await this.repo.Delete ( id, codUser );
    }
}
