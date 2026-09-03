import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createCategoriaSchema, updateCategoriaSchema } from './categorias.schema';
import { CategoriasController } from './categorias.controller';

const CategoriasRouter = Router();
const controller = new CategoriasController();

CategoriasRouter.get
(
    '/',
    controller.ListCategoriasController
);
CategoriasRouter.get
(
    '/:id',
    controller.GetByIdCategoriasController
);
CategoriasRouter.post
(
    '/',
    Validate ( createCategoriaSchema ),
    controller.CreateCategoriasController
);
CategoriasRouter.put
(
    '/:id',
    Validate ( updateCategoriaSchema ),
    controller.UpdateCategoriasController
);
CategoriasRouter.delete
(
    '/:id',
    controller.RemoveCategoriasController
);

export default CategoriasRouter;
