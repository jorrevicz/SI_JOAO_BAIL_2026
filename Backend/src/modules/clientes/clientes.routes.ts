import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createClienteSchema, updateClienteSchema } from './clientes.schema';
import { ClientesController } from './clientes.controller';

const ClientesRouter = Router();
const controller = new ClientesController();

ClientesRouter.get    ( '/',    controller.ListClientesController );
ClientesRouter.get    ( '/:id', controller.GetByIdClientesController );
ClientesRouter.post   ( '/',    Validate ( createClienteSchema ), controller.CreateClientesController );
ClientesRouter.put    ( '/:id', Validate ( updateClienteSchema ), controller.UpdateClientesController );
ClientesRouter.delete ( '/:id', controller.RemoveClientesController );

export default ClientesRouter;
