import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createProcedimentoSchema, updateProcedimentoSchema } from './procedimentos.schema';
import { ProcedimentosController } from './procedimentos.controller';

const ProcedimentosRouter = Router();
const controller = new ProcedimentosController();

ProcedimentosRouter.get
(
    '/',
    controller.ListProcedimentosController
);
ProcedimentosRouter.get
(
    '/:id',
    controller.GetByIdProcedimentosController
);
ProcedimentosRouter.post
(
    '/',
    Validate ( createProcedimentoSchema ),
    controller.CreateProcedimentosController
);
ProcedimentosRouter.put
(
    '/:id',
    Validate ( updateProcedimentoSchema ),
    controller.UpdateProcedimentosController
);
ProcedimentosRouter.delete
(
    '/:id',
    controller.RemoveProcedimentosController
);

export default ProcedimentosRouter;
