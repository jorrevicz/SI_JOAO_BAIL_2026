import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createProdutoSchema, updateProdutoSchema } from './produtos.schema';
import { ProdutosController } from './produtos.controller';

const ProdutosRouter = Router();
const controller = new ProdutosController();

ProdutosRouter.get
(
    '/',
    controller.ListProdutosController
);
ProdutosRouter.get
(
    '/:id',
    controller.GetByIdProdutosController
);
ProdutosRouter.post
(
    '/',
    Validate ( createProdutoSchema ),
    controller.CreateProdutosController
);
ProdutosRouter.put
(
    '/:id',
    Validate ( updateProdutoSchema ),
    controller.UpdateProdutosController
);
ProdutosRouter.delete
(
    '/:id',
    controller.RemoveProdutosController
);

export default ProdutosRouter;
