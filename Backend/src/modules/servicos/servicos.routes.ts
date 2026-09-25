import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createServicoSchema, updateServicoSchema } from './servicos.schema';
import { ServicosController } from './servicos.controller';

const ServicosRouter = Router();
const controller = new ServicosController();

ServicosRouter.get
(
    '/',
    controller.ListServicosController
);
ServicosRouter.get
(
    '/:id',
    controller.GetByIdServicosController
);
ServicosRouter.post
(
    '/',
    Validate ( createServicoSchema ),
    controller.CreateServicosController
);
ServicosRouter.put
(
    '/:id',
    Validate ( updateServicoSchema ),
    controller.UpdateServicosController
);
ServicosRouter.delete
(
    '/:id',
    controller.RemoveServicosController
);

export default ServicosRouter;
