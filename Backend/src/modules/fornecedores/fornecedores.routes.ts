import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createFornecedorSchema, updateFornecedorSchema } from './fornecedores.schema';
import { FornecedoresController } from './fornecedores.controller';

const FornecedoresRouter = Router();
const controller = new FornecedoresController();

FornecedoresRouter.get    ( '/',    controller.ListFornecedoresController );
FornecedoresRouter.get    ( '/:id', controller.GetByIdFornecedoresController );
FornecedoresRouter.post   ( '/',    Validate ( createFornecedorSchema ), controller.CreateFornecedoresController );
FornecedoresRouter.put    ( '/:id', Validate ( updateFornecedorSchema ), controller.UpdateFornecedoresController );
FornecedoresRouter.delete ( '/:id', controller.RemoveFornecedoresController );

export default FornecedoresRouter;
