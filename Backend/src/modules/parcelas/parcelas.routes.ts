import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createParcelaSchema, updateParcelaSchema } from './parcelas.schema';
import { ParcelasController } from './parcelas.controller';

const ParcelasRouter = Router();
const controller = new ParcelasController();

ParcelasRouter.get    ( '/',    controller.ListParcelasController    );
ParcelasRouter.get    ( '/:id', controller.GetByIdParcelasController );
ParcelasRouter.post   ( '/',    Validate ( createParcelaSchema ), controller.CreateParcelaController );
ParcelasRouter.put    ( '/:id', Validate ( updateParcelaSchema ), controller.UpdateParcelaController );
ParcelasRouter.delete ( '/:id', controller.RemoveParcelaController  );

export default ParcelasRouter;
