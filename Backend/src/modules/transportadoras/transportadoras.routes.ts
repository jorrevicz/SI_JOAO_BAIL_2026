import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createTransportadoraSchema, updateTransportadoraSchema } from './transportadoras.schema';
import { TransportadorasController } from './transportadoras.controller';

const TransportadorasRouter = Router();
const controller = new TransportadorasController();

TransportadorasRouter.get    ( '/',    controller.ListTransportadorasController );
TransportadorasRouter.get    ( '/:id', controller.GetByIdTransportadorasController );
TransportadorasRouter.post   ( '/',    Validate ( createTransportadoraSchema ), controller.CreateTransportadorasController );
TransportadorasRouter.put    ( '/:id', Validate ( updateTransportadoraSchema ), controller.UpdateTransportadorasController );
TransportadorasRouter.delete ( '/:id', controller.RemoveTransportadorasController );

export default TransportadorasRouter;
