import type postgres from 'postgres';
import { AppError } from '../../shared/errors/AppError';
import { WithTransaction } from '../../shared/transaction/withTransaction';
import { OrdensServicoRepository } from './ordensServico.repository';
import { AparelhosRepository } from '../aparelhos/aparelhos.repository';
import { EquipamentosRepository } from '../equipamentos/equipamentos.repository';
import { ProcedimentosRepository } from '../procedimentos/procedimentos.repository';
import { ProcedimentosOdSRepository } from '../procedimentos-ods/procedimentosOdS.repository';
import { ClientesRepository } from '../clientes/clientes.repository';
import type
{
    AbrirOrdemServicoInput,
    RegistrarDiagnosticoInput,
} from './ordensServico.schema';

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
    )
    {};

    async ListOrdensServico
    (
        limit  = 50,
        afterId = '',
        codCliente?: number
    )
    {
        return this.repo.List ( limit, afterId, codCliente );
    };

    async FindOrdemServico
    (
        numOdS: string,
        transaction?: postgres.TransactionSql
    )
    {
        const os = await this.repo.FindById ( numOdS, transaction );

        if ( !os )
        {
            throw new AppError ( 'Ordem de Serviço não encontrada.', 404 );
        }

        const [ aparelho, equipamento, procedimentos ] = await Promise.all
        ([
            this.aparelhosRepo.FindById ( os.codAparelho, transaction ),
            this.equipamentosRepo.FindById ( os.codEquipamento, transaction ),
            this.procedimentosOdSRepo.ListByOS ( numOdS, transaction ),
        ]);

        return { ...os, aparelho, equipamento, procedimentos };
    };

    /**
     * Abertura atômica (RNF06): a OS e as fichas de Aparelho/Equipamento daquela
     * unidade nascem juntas ou não nascem.
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
            const equipamento = await this.equipamentosRepo.Create ( data.equipamento, codUser, transaction );

            const os = await this.repo.Create
            (
                {
                    numOdS:         data.numOdS,
                    codCliente:     data.codCliente,
                    atendente:      data.atendente,
                    acessorio:      data.acessorio,
                    defeito:        data.defeito,
                    obsBalcao:      data.obsBalcao,
                    tipoOdS:        data.tipoOdS,
                    solicitante:    data.solicitante,
                    codAparelho:    aparelho.codAparelho,
                    codEquipamento: equipamento.codEquipamento,
                },
                codUser,
                transaction
            );

            return { ...os, aparelho, equipamento };
        } );
    };

    /**
     * Diagnóstico: operação dedicada (não passa pelo Update genérico). Reconcilia a
     * checklist de ProcedimentosOdS por diferença de conjuntos (chave codProcedimento),
     * mesmo padrão de Condição de Pagamento × Parcelas.
     */
    async RegistrarDiagnostico
    (
        numOdS: string,
        data:   RegistrarDiagnosticoInput,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const atualizada = await this.repo.RegistrarDiagnostico
            (
                numOdS,
                { obsTecnica: data.obsTecnica, historicoManutencao: data.historicoManutencao },
                codUser,
                transaction
            );

            if ( !atualizada )
            {
                throw new AppError ( 'Ordem de Serviço não encontrada.', 404 );
            }

            const checagensExistentes = await this.procedimentosOdSRepo.ListByOS ( numOdS, transaction );
            const codigosDesejados    = new Set ( data.procedimentos.map ( ( item ) => item.codProcedimento ) );
            const codigosExistentes   = new Set ( checagensExistentes.map ( ( item ) => Number ( item.codProcedimento ) ) );

            for ( const checagem of checagensExistentes )
            {
                if ( !codigosDesejados.has ( checagem.codProcedimento ) )
                {
                    await this.procedimentosOdSRepo.Delete ( numOdS, checagem.codProcedimento, codUser, transaction );
                }
            }

            for ( const item of data.procedimentos )
            {
                await this.AssertProcedimento ( item.codProcedimento, transaction );

                if ( codigosExistentes.has ( item.codProcedimento ) )
                {
                    await this.procedimentosOdSRepo.Update ( numOdS, item.codProcedimento, item, codUser, transaction );
                }
                else
                {
                    await this.procedimentosOdSRepo.Create ( numOdS, item, codUser, transaction );
                }
            }

            return this.FindOrdemServico ( numOdS, transaction );
        } );
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
}
