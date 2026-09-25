import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createFuncionarioSchema, updateFuncionarioSchema } from './funcionarios.schema';
import { FuncionariosController } from './funcionarios.controller';

const FuncionariosRouter = Router();
const controller = new FuncionariosController();

FuncionariosRouter.get
(
    '/',
    controller.ListFuncionariosController
);
FuncionariosRouter.get
(
    '/:id',
    controller.GetByIdFuncionariosController
);
FuncionariosRouter.post
(
    '/',
    Validate ( createFuncionarioSchema ),
    controller.CreateFuncionariosController
);
FuncionariosRouter.put
(
    '/:id',
    Validate ( updateFuncionarioSchema ),
    controller.UpdateFuncionariosController
);
FuncionariosRouter.delete
(
    '/:id',
    controller.RemoveFuncionariosController
);

export default FuncionariosRouter;
