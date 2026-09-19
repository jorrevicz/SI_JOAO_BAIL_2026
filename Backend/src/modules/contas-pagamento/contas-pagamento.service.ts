import { AppError } from '../../shared/errors/AppError';
import { ContasPagamentoRepository } from './contas-pagamento.repository';
import type { ContaAPagarId } from './contas-pagamento.repository';
import { FornecedoresRepository } from '../fornecedores/fornecedores.repository';
import { FormasPagamentoRepository } from '../formas-pagamento/formasPagamento.repository';
import { ValidarDocumentoFiscalInexistente } from '../../shared/documento-fiscal/documentoFiscal.service';
import type { CreateContasAPAgarInput, UpdateContasAPagarInput } from './contas-pagamento.schema';

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
        return this.repo.List ( limit, afterCursor );
    }

    async FindConta ( id: ContaAPagarId )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a pagar não encontrada.', 404 );
        }

        return conta;
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
            { numero: data.numero, modelo: data.modelo, serie: data.serie },
            ( chave ) => this.repo.ExisteDocumento ( chave )
        );

        return this.repo.Create ( data, codUser );
    }

    async UpdateConta ( id: ContaAPagarId, data: UpdateContasAPagarInput, codUser: number )
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

        const atualizada = await this.repo.Update ( id, data, codUser );

        if ( !atualizada )
        {
            throw new AppError ( 'Conta a pagar não encontrada.', 404 );
        }

        return atualizada;
    }

    async RegistrarBaixa ( id: ContaAPagarId, valorBaixa: string, dtBaixa: Date, codUser: number )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a pagar não encontrada.', 404 );
        }

        if ( conta.valorBaixa !== null || conta.dtBaixa !== null )
        {
            throw new AppError ( 'Esta conta a pagar já foi baixada.', 409 );
        }

        if ( conta.justificativaCancelamento !== null )
        {
            throw new AppError ( 'Não é possível baixar uma conta a pagar cancelada.', 409 );
        }

        return this.repo.RegistrarBaixa ( id, valorBaixa, dtBaixa, codUser );
    }

    async CancelarConta ( id: ContaAPagarId, justificativaCancelamento: string, codUser: number )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a pagar não encontrada.', 404 );
        }

        if ( conta.valorBaixa !== null || conta.dtBaixa !== null )
        {
            throw new AppError ( 'Não é possível cancelar uma conta a pagar já baixada.', 409 );
        }

        return this.repo.Cancelar ( id, justificativaCancelamento, codUser );
    }

    async DeleteConta ( id: ContaAPagarId, codUser: number )
    {
        const conta = await this.repo.FindById ( id );

        if ( !conta )
        {
            throw new AppError ( 'Conta a pagar não encontrada.', 404 );
        }

        await this.repo.Delete ( id, codUser );
    }
}
