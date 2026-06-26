import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createEstadoSchema, updateEstadoSchema } from './estados.schema';
import { EstadosController } from './estados.controller';

const EstadosRouter = Router();
const controller = new EstadosController();

EstadosRouter.get    ( '/',    controller.ListEstadosController    );
EstadosRouter.get    ( '/:id', controller.GetByIdEstadosController );
EstadosRouter.post   ( '/',    Validate ( createEstadoSchema ), controller.CreateEstadosController );
EstadosRouter.put    ( '/:id', Validate ( updateEstadoSchema ), controller.UpdateEstadosController );
EstadosRouter.delete ( '/:id', controller.RemoveEstadosController  );

export default EstadosRouter;
