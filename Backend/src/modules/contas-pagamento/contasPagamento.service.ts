import { ComVlrTotal, CalcularVlrTotalConta } from '../../shared/conta/contaTotal';
import type { ValoresConta } from '../../shared/conta/contaTotal';
import { AppError } from '../../shared/errors/AppError';
import { ContasPagamentoRepository } from './contasPagamento.repository';
import type { ContaAPagarId } from './contasPagamento.repository';
import { FornecedoresRepository } from '../fornecedores/fornecedores.repository';
import { FormasPagamentoRepository } from '../formas-pagamento/formasPagamento.repository';
import { ValidarDocumentoFiscalInexistente } from '../../shared/documento-fiscal/documentoFiscal.service';
import type { CreateContasAPAgarInput, ChaveContaAPagar } from './contasPagamento.schema';

export class ContasPagamentoService
{
    constructor
    (
        private readonly repo:             ContasPagamentoRepository = new ContasPagamentoRepository(),
        private readonly fornecedoresRepo: FornecedoresRepository    = new FornecedoresRepository(),
        private readonly formasRepo:       FormasPagamentoRepository = new FormasPagamentoRepository(),
    ) {}

    async ListContas ( limit = 50, afterCursor?: ContaAPagarId )
    {
        return ( await this.repo.List ( limit, afterCursor ) ).map ( ComVlrTotal );
    }

    async FindConta ( id: ContaAPagarId )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a pagar não encontrada.', 404 );
        }

        return ComVlrTotal ( conta );
    }

    // Prévia para o formulário: nada é gravado e o Frontend não faz a conta.
    CalcularTotal ( valores: ValoresConta )
    {
        return { vlrTotal: CalcularVlrTotalConta ( valores ) };
    }

    async CreateConta ( data: CreateContasAPAgarInput, codUser: number )
    {
        const fornecedor = await this.fornecedoresRepo.FindById ( data.codFornecedor );

        if ( !fornecedor )
        {
            throw new AppError ( 'Fornecedor informado não existe.', 400 );
        }

        const forma = await this.formasRepo.FindById ( data.codFormaDePag );

            if ( !forma )
            {
            throw new AppError ( 'Forma de pagamento informada não existe.', 400 );
        }

        await ValidarDocumentoFiscalInexistente
        (
            { numero: data.numero, modelo: data.modelo, serie: data.serie, codFornecedor: data.codFornecedor, parcela: data.parcela },
            ( chave ) => this.repo.ExisteDocumento ( chave )
        );

        return ComVlrTotal ( await this.repo.Create ( data, codUser ) );
    }

    async CancelarConta ( id: ContaAPagarId, justificativaCancelamento: string, codUser: number )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a pagar não encontrada.', 404 );
        }

        if ( conta.justificativaCancelamento !== null )
        {
            throw new AppError ( 'Esta conta a pagar já foi cancelada.', 409 );
        }

        return ComVlrTotal ( await this.repo.Cancelar ( id, justificativaCancelamento, codUser ) );
    }

    async ValidarChave ( chave: ChaveContaAPagar )
    {
        await ValidarDocumentoFiscalInexistente
        (
            chave,
            ( c ) => this.repo.ExisteDocumento ( c )
        );

        return { valido: true };
    }

}
