import { ComVlrTotal, CalcularVlrTotalConta } from '../../shared/conta/contaTotal';
import type { ValoresConta } from '../../shared/conta/contaTotal';
import { AppError } from '../../shared/errors/AppError';
import { ContasReceberRepository } from './contasReceber.repository';
import type { ContaAReceberId } from './contasReceber.repository';
import { ClientesRepository } from '../clientes/clientes.repository';
import { FormasPagamentoRepository } from '../formas-pagamento/formasPagamento.repository';
import { ValidarDocumentoFiscalInexistente } from '../../shared/documento-fiscal/documentoFiscal.service';
import type { CreateContasAReceberInput, ChaveContaAReceber } from './contasReceber.schema';

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
        return ( await this.repo.List ( limit, afterCursor ) ).map ( ComVlrTotal );
    }

    async FindConta ( id: ContaAReceberId )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a receber não encontrada.', 404 );
        }

        return ComVlrTotal ( conta );
    }

    // Prévia para o formulário: nada é gravado e o Frontend não faz a conta.
    CalcularTotal ( valores: ValoresConta )
    {
        return { vlrTotal: CalcularVlrTotalConta ( valores ) };
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
            { numero: data.numero, modelo: data.modelo, serie: data.serie, codCliente: data.codCliente, parcela: data.parcela },
            ( chave ) => this.repo.ExisteDocumento ( chave )
        );

        return ComVlrTotal ( await this.repo.Create ( data, codUser ) );
    }

    async CancelarConta ( id: ContaAReceberId, justificativaCancelamento: string, codUser: number )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a receber não encontrada.', 404 );
        }

        if ( conta.justificativaCancelamento !== null )
        {
            throw new AppError ( 'Esta conta a receber já foi cancelada.', 409 );
        }

        return ComVlrTotal ( await this.repo.Cancelar ( id, justificativaCancelamento, codUser ) );
    }

    async ValidarChave ( chave: ChaveContaAReceber )
    {
        await ValidarDocumentoFiscalInexistente
        (
            chave,
            ( c ) => this.repo.ExisteDocumento ( c )
        );

        return { valido: true };
    }

}
