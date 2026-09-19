import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { abrirOrdemServicoSchema, registrarDiagnosticoSchema } from './ordensServico.schema';
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
    '/:numOdS/diagnostico',
    Validate ( registrarDiagnosticoSchema ),
    controller.RegistrarDiagnosticoController
);

export default OrdensServicoRouter;
