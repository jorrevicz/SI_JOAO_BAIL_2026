import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createCargoSchema, updateCargoSchema } from './cargos.schema';
import { CargosController } from './cargos.controller';

const CargosRouter = Router();
const controller = new CargosController();

CargosRouter.get
(
    '/',
    controller.ListCargosController
);
CargosRouter.get
(
    '/:id',
    controller.GetByIdCargosController
);
CargosRouter.post
(
    '/',
    Validate ( createCargoSchema ),
    controller.CreateCargosController
);
CargosRouter.put
(
    '/:id',
    Validate ( updateCargoSchema ),
    controller.UpdateCargosController
);
CargosRouter.delete
(
    '/:id',
    controller.RemoveCargosController
);

export default CargosRouter;
