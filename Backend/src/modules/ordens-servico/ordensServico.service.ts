import type postgres from 'postgres';
import { AppError } from '../../shared/errors/AppError';
import { WithTransaction } from '../../shared/transaction/withTransaction';
import { OrdensServicoRepository } from './ordensServico.repository';
import { AparelhosRepository } from '../aparelhos/aparelhos.repository';
import { EquipamentosRepository } from '../equipamentos/equipamentos.repository';
import { ProcedimentosRepository } from '../procedimentos/procedimentos.repository';
import { ProcedimentosOdSRepository } from '../procedimentos-ods/procedimentosOdS.repository';
import { ClientesRepository } from '../clientes/clientes.repository';
import { ServicosRepository } from '../servicos/servicos.repository';
import { ServicosOdSRepository } from '../servicos-ods/servicosOdS.repository';
import { PecasRepository } from '../pecas/pecas.repository';
import { OrcamentoPecasOdSRepository } from '../orcamento-pecas-ods/orcamentoPecasOdS.repository';
import { SubstituirPecasOdSRepository } from '../substituir-pecas-ods/substituirPecasOdS.repository';
import type
{
    AbrirOrdemServicoInput,
    DefinirProcedimentosInput,
    RegistrarDiagnosticoInput,
    RegistrarExecucaoInput,
    RegistrarSubstituicaoPecasInput,
} from './ordensServico.schema';

/**
 * Domínio fechado da máquina de estados da OS (Lote OS-B). `tipoOdS` (já existente)
 * classifica a OS livremente (ex.: "Garantia") e não muda; `situacao` reflete o
 * progresso real do atendimento.
 */
export const SITUACAO_ODS = {
    ABERTA:               'Aberta',
    EM_EXECUCAO:           'Em execução',
    AGUARDANDO_APROVACAO: 'Aguardando aprovação',
    CONCLUIDA:            'Concluída',
    ENTREGUE:             'Entregue',
    CANCELADA:            'Cancelada',
} as const;

export class OrdensServicoService
{
    constructor
    (
        private readonly repo:
            OrdensServicoRepository = new OrdensServicoRepository(),
        private readonly aparelhosRepo:
            AparelhosRepository = new AparelhosRepository(),
        private readonly equipamentosRepo:
            EquipamentosRepository = new EquipamentosRepository(),
        private readonly procedimentosRepo:
            ProcedimentosRepository = new ProcedimentosRepository(),
        private readonly procedimentosOdSRepo:
            ProcedimentosOdSRepository = new ProcedimentosOdSRepository(),
        private readonly clientesRepo:
            ClientesRepository = new ClientesRepository(),
        private readonly servicosRepo:
            ServicosRepository = new ServicosRepository(),
        private readonly servicosOdSRepo:
            ServicosOdSRepository = new ServicosOdSRepository(),
        private readonly pecasRepo:
            PecasRepository = new PecasRepository(),
        private readonly orcamentoPecasOdSRepo:
            OrcamentoPecasOdSRepository = new OrcamentoPecasOdSRepository(),
        private readonly substituirPecasOdSRepo:
            SubstituirPecasOdSRepository = new SubstituirPecasOdSRepository(),
    )
    {};

    async ListOrdensServico
    (
        limit  = 50,
        afterId = 0,
        codCliente?: number
    )
    {
        return this.repo.List ( limit, afterId, codCliente );
    };

    async FindOrdemServico
    (
        numOdS: number,
        transaction?: postgres.TransactionSql
    )
    {
        const os = await this.repo.FindById ( numOdS, transaction );

        if ( !os )
        {
            throw new AppError ( 'Ordem de Serviço não encontrada.', 404 );
        }

        const [ aparelho, equipamento, procedimentos, servicos, orcamentoPecas, substituicaoPecas ] = await Promise.all
        ([
            this.aparelhosRepo.FindById ( os.codAparelho, transaction ),
            os.codEquipamento === null ? Promise.resolve ( null ) : this.equipamentosRepo.FindById ( os.codEquipamento, transaction ),
            this.procedimentosOdSRepo.ListByOS ( numOdS, transaction ),
            this.servicosOdSRepo.ListByOS ( numOdS, transaction ),
            this.orcamentoPecasOdSRepo.ListByOS ( numOdS, transaction ),
            this.substituirPecasOdSRepo.ListByOS ( numOdS, transaction ),
        ]);

        return { ...os, aparelho, equipamento, procedimentos, servicos, orcamentoPecas, substituicaoPecas };
    };

    /**
     * Exclusão é soft delete (`isActive = false`): o histórico da OS (checklist, serviços,
     * orçamento e substituições) permanece íntegro no banco.
     */
    async DeleteOrdemServico
    (
        numOdS:  number,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const removida = await this.repo.Delete ( numOdS, codUser, transaction );

            if ( !removida )
            {
                throw new AppError ( 'Ordem de Serviço não encontrada.', 404 );
            }
        } );
    };

    /**
     * Abertura atômica (RNF06): a OS e a ficha do Aparelho daquela unidade nascem
     * juntas ou não nascem. A ficha de Equipamento não é criada aqui — é levantada
     * pelo técnico no diagnóstico (`RegistrarDiagnostico`).
     */
    async AbrirOS
    (
        data:    AbrirOrdemServicoInput,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            await this.AssertCliente ( data.codCliente, transaction );

            const aparelho = await this.aparelhosRepo.Create ( data.aparelho, codUser, transaction );

            const os = await this.repo.Create
            (
                {
                    codCliente:     data.codCliente,
                    atendente:      data.atendente,
                    acessorio:      data.acessorio,
                    defeito:        data.defeito,
                    obsBalcao:      data.obsBalcao,
                    tipoOdS:        data.tipoOdS,
                    solicitante:    data.solicitante,
                    codAparelho:    aparelho.codAparelho,
                },
                codUser,
                transaction
            );

            return { ...os, aparelho };
        } );
    };

    /**
     * Estrutura da checklist da OS (RN009): define quais procedimentos entram na
     * checklist e em que ordem — reconciliada por diferença de conjuntos (chave
     * codProcedimento), mesmo padrão de Condição de Pagamento × Parcelas. Não toca em
     * nenhum campo de checagem (nasce/permanece nulo até o diagnóstico); é a única
     * operação que adiciona, remove ou reordena itens da lista — `RegistrarDiagnostico`
     * apenas herda essa estrutura e preenche a checagem de itens já existentes.
     */
    async DefinirProcedimentosOS
    (
        numOdS: number,
        data:   DefinirProcedimentosInput,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const os = await this.repo.FindById ( numOdS, transaction );

            if ( !os )
            {
                throw new AppError ( 'Ordem de Serviço não encontrada.', 404 );
            }

            const estruturaExistente = await this.procedimentosOdSRepo.ListByOS ( numOdS, transaction );
            const codigosDesejados   = new Set ( data.procedimentos.map ( ( item ) => item.codProcedimento ) );
            const codigosExistentes  = new Set ( estruturaExistente.map ( ( item ) => Number ( item.codProcedimento ) ) );

            for ( const item of estruturaExistente )
            {
                if ( !codigosDesejados.has ( item.codProcedimento ) )
                {
                    await this.procedimentosOdSRepo.Delete ( numOdS, item.codProcedimento, codUser, transaction );
                }
            }

            for ( const item of data.procedimentos )
            {
                await this.AssertProcedimento ( item.codProcedimento, transaction );

                if ( codigosExistentes.has ( item.codProcedimento ) )
                {
                    await this.procedimentosOdSRepo.UpdateOrdem ( numOdS, item.codProcedimento, item.ordem, codUser, transaction );
                }
                else
                {
                    await this.procedimentosOdSRepo.CreateEstrutura ( numOdS, item, codUser, transaction );
                }
            }

            return this.FindOrdemServico ( numOdS, transaction );
        } );
    };

    /**
     * Diagnóstico: operação dedicada (não passa pelo Update genérico). Preenche a
     * checagem (posição, resultado, observação e data/hora — informados pelo técnico)
     * de itens JÁ presentes na checklist (herdada de `DefinirProcedimentosOS` — RN009);
     * não adiciona, remove nem reordena a lista. Também reconcilia o orçamento de
     * peças (OrcamentoPecasOdS) por diferença de conjuntos (chave codPeca), mesmo
     * padrão de Condição de Pagamento × Parcelas — o orçamento de peças nasce aqui,
     * junto do diagnóstico, para já sair da inspeção com a cotação do que precisa ser
     * trocado. Ao ser registrado pela primeira vez, a OS avança de 'Aberta' para 'Em
     * execução'; ao final, recalcula a situação — 'Aguardando aprovação' se houver
     * peça orçada ainda não decidida pelo cliente, 'Em execução' caso contrário (RN —
     * Lote OS-B). Também registra a ficha técnica do Equipamento, quando informada:
     * cria e vincula à OS na primeira vez, atualiza nas seguintes; sem ela, a OS segue
     * sem Equipamento.
     */
    async RegistrarDiagnostico
    (
        numOdS: number,
        data:   RegistrarDiagnosticoInput,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const atualizada = await this.repo.RegistrarDiagnostico
            (
                numOdS,
                { historicoManutencao: data.historicoManutencao },
                codUser,
                transaction
            );

            if ( !atualizada )
            {
                throw new AppError ( 'Ordem de Serviço não encontrada.', 404 );
            }

            if ( data.equipamento )
            {
                if ( atualizada.codEquipamento === null )
                {
                    const equipamento = await this.equipamentosRepo.Create ( data.equipamento, codUser, transaction );
                    await this.repo.VincularEquipamento ( numOdS, equipamento.codEquipamento, codUser, transaction );
                }
                else
                {
                    await this.equipamentosRepo.Update ( atualizada.codEquipamento, data.equipamento, codUser, transaction );
                }
            }

            const checklistExistente = await this.procedimentosOdSRepo.ListByOS ( numOdS, transaction );
            const codigosNaChecklist = new Set ( checklistExistente.map ( ( item ) => Number ( item.codProcedimento ) ) );

            for ( const item of data.procedimentos )
            {
                if ( !codigosNaChecklist.has ( item.codProcedimento ) )
                {
                    throw new AppError
                    (
                        'Procedimento não faz parte da checklist desta Ordem de Serviço — adicione-o na tela de Procedimentos antes de registrar o diagnóstico.',
                        400
                    );
                }

                await this.procedimentosOdSRepo.UpdateChecagem ( numOdS, item.codProcedimento, item, codUser, transaction );
            }

            const orcamentosExistentes = await this.orcamentoPecasOdSRepo.ListByOS ( numOdS, transaction );
            const desejadosPeca        = new Set ( data.orcamentoPecas.map ( ( item ) => item.codPeca ) );
            const existentesPeca       = new Set ( orcamentosExistentes.map ( ( item ) => Number ( item.codPeca ) ) );

            for ( const linha of orcamentosExistentes )
            {
                if ( !desejadosPeca.has ( linha.codPeca ) )
                {
                    await this.orcamentoPecasOdSRepo.Delete ( numOdS, linha.codPeca, codUser, transaction );
                }
            }

            for ( const item of data.orcamentoPecas )
            {
                await this.AssertPeca ( item.codPeca, transaction );

                if ( existentesPeca.has ( item.codPeca ) )
                {
                    await this.orcamentoPecasOdSRepo.Update ( numOdS, item.codPeca, item, codUser, transaction );
                }
                else
                {
                    await this.orcamentoPecasOdSRepo.Create ( numOdS, item, codUser, transaction );
                }
            }

            if ( atualizada.situacao === SITUACAO_ODS.ABERTA )
            {
                await this.repo.AtualizarSituacao ( numOdS, SITUACAO_ODS.EM_EXECUCAO, codUser, transaction );
            }

            await this.RecomputarSituacaoExecucao ( numOdS, codUser, transaction );

            return this.FindOrdemServico ( numOdS, transaction );
        } );
    };

    /**
     * Execução: operação dedicada que reconcilia (por diferença de conjuntos, mesmo
     * padrão de ProcedimentosOdS/Parcelas) os serviços prestados (ServicosOdS) e
     * atualiza as observações técnicas finais do atendimento (`obsTecnica`) — registradas
     * ao fim da execução, depois que o trabalho foi concluído.
     */
    async RegistrarExecucao
    (
        numOdS: number,
        data:   RegistrarExecucaoInput,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const os = await this.repo.FindById ( numOdS, transaction );

            if ( !os )
            {
                throw new AppError ( 'Ordem de Serviço não encontrada.', 404 );
            }

            const servicosExistentes = await this.servicosOdSRepo.ListByOS ( numOdS, transaction );
            const desejadosServico   = new Set ( data.servicos.map ( ( item ) => item.codServico ) );
            const existentesServico  = new Set ( servicosExistentes.map ( ( item ) => Number ( item.codServico ) ) );

            for ( const linha of servicosExistentes )
            {
                if ( !desejadosServico.has ( linha.codServico ) )
                {
                    await this.servicosOdSRepo.Delete ( numOdS, linha.codServico, codUser, transaction );
                }
            }

            for ( const item of data.servicos )
            {
                await this.AssertServico ( item.codServico, transaction );

                if ( existentesServico.has ( item.codServico ) )
                {
                    await this.servicosOdSRepo.Update ( numOdS, item.codServico, item, codUser, transaction );
                }
                else
                {
                    await this.servicosOdSRepo.Create ( numOdS, item, codUser, transaction );
                }
            }

            await this.repo.AtualizarObsTecnica ( numOdS, data.obsTecnica, codUser, transaction );

            return this.FindOrdemServico ( numOdS, transaction );
        } );
    };

    /**
     * Aprovação do orçamento de uma peça (RN — aprovação por item, decisão do cliente).
     */
    async AprovarOrcamentoPeca
    (
        numOdS: number,
        codPeca: number,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const atualizado = await this.orcamentoPecasOdSRepo.Aprovar ( numOdS, codPeca, codUser, transaction );

            if ( !atualizado )
            {
                throw new AppError ( 'Orçamento de peça não encontrado para esta Ordem de Serviço.', 404 );
            }

            await this.RecomputarSituacaoExecucao ( numOdS, codUser, transaction );

            return this.FindOrdemServico ( numOdS, transaction );
        } );
    };

    /**
     * Reprovação do orçamento de uma peça: o cliente recusa aquele item, que sai da
     * lista ativa de orçamento (soft delete — mesmo vocabulário de remoção já usado
     * no restante do sistema).
     */
    async ReprovarOrcamentoPeca
    (
        numOdS: number,
        codPeca: number,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const existente = await this.orcamentoPecasOdSRepo.FindOne ( numOdS, codPeca, transaction );

            if ( !existente )
            {
                throw new AppError ( 'Orçamento de peça não encontrado para esta Ordem de Serviço.', 404 );
            }

            await this.orcamentoPecasOdSRepo.Delete ( numOdS, codPeca, codUser, transaction );
            await this.RecomputarSituacaoExecucao ( numOdS, codUser, transaction );

            return this.FindOrdemServico ( numOdS, transaction );
        } );
    };

    /**
     * Substituição efetiva de peças: lançamento manual do técnico com os valores
     * reais (podem divergir do orçamento) — mesma filosofia de lista embutida e
     * atômica de Parcelas × Condição de Pagamento, reconciliada por diferença de
     * conjuntos (chave codPeca). Só é possível substituir peça cujo orçamento tenha
     * sido aprovado pelo cliente para esta OS.
     */
    async RegistrarSubstituicaoPecas
    (
        numOdS: number,
        data:   RegistrarSubstituicaoPecasInput,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const os = await this.repo.FindById ( numOdS, transaction );

            if ( !os )
            {
                throw new AppError ( 'Ordem de Serviço não encontrada.', 404 );
            }

            const substituicoesExistentes = await this.substituirPecasOdSRepo.ListByOS ( numOdS, transaction );
            const desejados  = new Set ( data.pecas.map ( ( item ) => item.codPeca ) );
            const existentes = new Set ( substituicoesExistentes.map ( ( item ) => Number ( item.codPeca ) ) );

            for ( const linha of substituicoesExistentes )
            {
                if ( !desejados.has ( linha.codPeca ) )
                {
                    await this.substituirPecasOdSRepo.Delete ( numOdS, linha.codPeca, codUser, transaction );
                }
            }

            for ( const item of data.pecas )
            {
                await this.AssertPeca ( item.codPeca, transaction );
                await this.AssertOrcamentoAprovado ( numOdS, item.codPeca, transaction );

                if ( existentes.has ( item.codPeca ) )
                {
                    await this.substituirPecasOdSRepo.Update ( numOdS, item.codPeca, item, codUser, transaction );
                }
                else
                {
                    await this.substituirPecasOdSRepo.Create ( numOdS, item, codUser, transaction );
                }
            }

            return this.FindOrdemServico ( numOdS, transaction );
        } );
    };

    /**
     * Recalcula a situação da OS a partir do orçamento de peças ativo: havendo item
     * ainda não aprovado, a OS aguarda decisão do cliente; do contrário, segue em
     * execução. Não regride estados finais (Concluída/Entregue/Cancelada — Lote OS-C).
     */
    private async RecomputarSituacaoExecucao
    (
        numOdS: number,
        codUser: number,
        transaction: postgres.TransactionSql
    )
    {
        const os = await this.repo.FindById ( numOdS, transaction );

        if ( !os )
        {
            return;
        }

        if
        (
            os.situacao === SITUACAO_ODS.CONCLUIDA ||
            os.situacao === SITUACAO_ODS.ENTREGUE  ||
            os.situacao === SITUACAO_ODS.CANCELADA
        )
        {
            return;
        }

        const orcamentos  = await this.orcamentoPecasOdSRepo.ListByOS ( numOdS, transaction );
        const temPendente = orcamentos.some ( ( item ) => !item.aprovado );

        const proximaSituacao = temPendente ? SITUACAO_ODS.AGUARDANDO_APROVACAO : SITUACAO_ODS.EM_EXECUCAO;

        if ( os.situacao !== proximaSituacao )
        {
            await this.repo.AtualizarSituacao ( numOdS, proximaSituacao, codUser, transaction );
        }
    };

    private async AssertCliente
    (
        codCliente: number,
        transaction?: postgres.TransactionSql
    )
    {
        if ( !( await this.clientesRepo.FindById ( codCliente, transaction ) ) )
        {
            throw new AppError ( 'Cliente informado não existe.', 400 );
        }
    };

    private async AssertProcedimento
    (
        codProcedimento: number,
        transaction?: postgres.TransactionSql
    )
    {
        if ( !( await this.procedimentosRepo.FindById ( codProcedimento, transaction ) ) )
        {
            throw new AppError ( 'Procedimento informado não existe.', 400 );
        }
    };

    private async AssertServico
    (
        codServico: number,
        transaction?: postgres.TransactionSql
    )
    {
        if ( !( await this.servicosRepo.FindById ( codServico, transaction ) ) )
        {
            throw new AppError ( 'Serviço informado não existe.', 400 );
        }
    };

    private async AssertPeca
    (
        codPeca: number,
        transaction?: postgres.TransactionSql
    )
    {
        if ( !( await this.pecasRepo.FindById ( codPeca, transaction ) ) )
        {
            throw new AppError ( 'Peça informada não existe.', 400 );
        }
    };

    private async AssertOrcamentoAprovado
    (
        numOdS: number,
        codPeca: number,
        transaction?: postgres.TransactionSql
    )
    {
        const orcamento = await this.orcamentoPecasOdSRepo.FindOne ( numOdS, codPeca, transaction );

        if ( !orcamento || !orcamento.aprovado )
        {
            throw new AppError
            (
                'Só é possível substituir uma peça cujo orçamento tenha sido aprovado pelo cliente nesta Ordem de Serviço.',
                409
            );
        }
    };
}
