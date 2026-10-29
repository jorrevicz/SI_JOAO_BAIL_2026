import type postgres from 'postgres';
import { ComVlrTotal, CalcularVlrTotalConta } from '../../shared/conta/contaTotal';
import type { ValoresConta } from '../../shared/conta/contaTotal';
import { AppError } from '../../shared/errors/AppError';
import { ContasPagamentoRepository } from './contasPagamento.repository';
import type { ContaAPagarId } from './contasPagamento.repository';
import { FornecedoresRepository } from '../fornecedores/fornecedores.repository';
import { FormasPagamentoRepository } from '../formas-pagamento/formasPagamento.repository';
import { ComprasRepository } from '../compras/compras.repository';
import type { CompraId } from '../compras/compras.repository';
import { ValidarDocumentoFiscalInexistente } from '../../shared/documento-fiscal/documentoFiscal.service';
import type { CreateContasAPAgarInput, ChaveContaAPagar } from './contasPagamento.schema';

export class ContasPagamentoService
{
    constructor
    (
        private readonly repo:             ContasPagamentoRepository = new ContasPagamentoRepository(),
        private readonly fornecedoresRepo: FornecedoresRepository    = new FornecedoresRepository(),
        private readonly formasRepo:       FormasPagamentoRepository = new FormasPagamentoRepository(),
        private readonly comprasRepo:      ComprasRepository         = new ComprasRepository(),
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

    /**
     * Exclusão (soft delete) das contas a pagar de uma compra. Não existe exclusão nem
     * cancelamento avulso pela tela de Contas a Pagar: a conta só cai junto com a compra que
     * a originou, por isso este método é chamado exclusivamente pelo `CancelarCompra`,
     * dentro da mesma transação (RNF06).
     *
     * A compra do mesmo documento (número, modelo, série e fornecedor) precisa já estar
     * desativada (`isActive = false`) — se ainda estiver ativa, nenhuma conta é tocada (409).
     * Todas as parcelas ainda não canceladas recebem a justificativa da compra; cada uma é
     * excluída pela sua chave primária completa (documento + fornecedor + parcela).
     */
    async CancelarContasDaCompra
    (
        compraId: CompraId,
        justificativaCancelamento: string,
        codUser: number,
        transaction?: postgres.TransactionSql
    )
    {
        const compra = await this.comprasRepo.FindById ( compraId, transaction );

        if ( !compra )
        {
            throw new AppError ( 'Compra não encontrada.', 404 );
        }

        if ( compra.isActive )
        {
            throw new AppError ( 'As contas a pagar só podem ser excluídas a partir de uma compra cancelada.', 409 );
        }

        const contas = await this.repo.ListAtivasPorDocumento
        (
            { numero: compraId.numero, modelo: compraId.modelo, serie: compraId.serie, codFornecedor: compraId.codForn },
            transaction
        );

        const canceladas = [];

        for ( const conta of contas )
        {
            const id: ContaAPagarId =
            {
                numero:        conta.numero,
                modelo:        conta.modelo,
                serie:         conta.serie,
                codFornecedor: conta.codFornecedor,
                parcela:       conta.parcela,
            };

            const cancelada = await this.repo.Cancelar ( id, justificativaCancelamento, codUser, transaction );

            if ( !cancelada )
            {
                throw new AppError ( 'Esta conta a pagar já foi cancelada.', 409 );
            }

            canceladas.push ( ComVlrTotal ( cancelada ) );
        }

        return canceladas;
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
