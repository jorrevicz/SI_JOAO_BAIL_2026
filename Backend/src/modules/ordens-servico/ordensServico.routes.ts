import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import
{
    abrirOrdemServicoSchema,
    definirProcedimentosSchema,
    registrarDiagnosticoSchema,
    registrarExecucaoSchema,
    registrarSubstituicaoPecasSchema,
} from './ordensServico.schema';
import { OrdensServicoController } from './ordensServico.controller';

const OrdensServicoRouter = Router();
const controller = new OrdensServicoController();

OrdensServicoRouter.get
(
    '/',
    controller.ListOrdensServicoController
);
OrdensServicoRouter.get
(
    '/:numOdS',
    controller.GetByIdOrdensServicoController
);
OrdensServicoRouter.post
(
    '/',
    Validate ( abrirOrdemServicoSchema ),
    controller.AbrirOrdemServicoController
);
OrdensServicoRouter.patch
(
    '/:numOdS/procedimentos',
    Validate ( definirProcedimentosSchema ),
    controller.DefinirProcedimentosController
);
OrdensServicoRouter.patch
(
    '/:numOdS/diagnostico',
    Validate ( registrarDiagnosticoSchema ),
    controller.RegistrarDiagnosticoController
);
OrdensServicoRouter.patch
(
    '/:numOdS/execucao',
    Validate ( registrarExecucaoSchema ),
    controller.RegistrarExecucaoController
);
OrdensServicoRouter.patch
(
    '/:numOdS/orcamento-pecas/:codPeca/aprovar',
    controller.AprovarOrcamentoPecaController
);
OrdensServicoRouter.patch
(
    '/:numOdS/orcamento-pecas/:codPeca/reprovar',
    controller.ReprovarOrcamentoPecaController
);
OrdensServicoRouter.patch
(
    '/:numOdS/substituicao-pecas',
    Validate ( registrarSubstituicaoPecasSchema ),
    controller.RegistrarSubstituicaoPecasController
);

export default OrdensServicoRouter;
