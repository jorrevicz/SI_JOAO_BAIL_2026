import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createPaisSchema, updatePaisSchema } from './paises.schema';
import { PaisesController } from './paises.controller';

const PaisesRouter = Router();
const controller = new PaisesController();

PaisesRouter.get
( 
    '/', 
    controller.ListPaisesController 
);
PaisesRouter.get    
( 
    '/:id', 
    controller.GetByIdPaisesController 
);
PaisesRouter.post   
( 
    '/', 
    Validate ( createPaisSchema ), 
    controller.CreatePaisesController 
);
PaisesRouter.put    
( 
    '/:id', 
    Validate ( updatePaisSchema ), 
    controller.UpdatePaisesController 
);
PaisesRouter.delete 
( 
    '/:id', 
    controller.RemovePaisesController 
);

export default PaisesRouter;