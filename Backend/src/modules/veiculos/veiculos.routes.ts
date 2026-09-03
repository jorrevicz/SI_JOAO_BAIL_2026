import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createVeiculoSchema, updateVeiculoSchema } from './veiculos.schema';
import { VeiculosController } from './veiculos.controller';

const VeiculosRouter = Router();
const controller = new VeiculosController();

VeiculosRouter.get    ( '/',    controller.ListVeiculosController );
VeiculosRouter.get    ( '/:id', controller.GetByIdVeiculosController );
VeiculosRouter.post   ( '/',    Validate ( createVeiculoSchema ), controller.CreateVeiculosController );
VeiculosRouter.put    ( '/:id', Validate ( updateVeiculoSchema ), controller.UpdateVeiculosController );
VeiculosRouter.delete ( '/:id', controller.RemoveVeiculosController );

export default VeiculosRouter;
