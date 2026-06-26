import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createCidadeSchema, updateCidadeSchema } from './cidades.schema';
import { CidadesController } from './cidades.controller';

const CidadesRouter = Router();
const controller = new CidadesController();

CidadesRouter.get    ( '/',    controller.ListCidadesController    );
CidadesRouter.get    ( '/:id', controller.GetByIdCidadesController );
CidadesRouter.post   ( '/',    Validate ( createCidadeSchema ), controller.CreateCidadesController );
CidadesRouter.put    ( '/:id', Validate ( updateCidadeSchema ), controller.UpdateCidadesController );
CidadesRouter.delete ( '/:id', controller.RemoveCidadesController  );

export default CidadesRouter;
