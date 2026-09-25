import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createPecaSchema, updatePecaSchema } from './pecas.schema';
import { PecasController } from './pecas.controller';

const PecasRouter = Router();
const controller = new PecasController();

PecasRouter.get
(
    '/',
    controller.ListPecasController
);
PecasRouter.get
(
    '/:id',
    controller.GetByIdPecasController
);
PecasRouter.post
(
    '/',
    Validate ( createPecaSchema ),
    controller.CreatePecasController
);
PecasRouter.put
(
    '/:id',
    Validate ( updatePecaSchema ),
    controller.UpdatePecasController
);
PecasRouter.delete
(
    '/:id',
    controller.RemovePecasController
);

export default PecasRouter;
