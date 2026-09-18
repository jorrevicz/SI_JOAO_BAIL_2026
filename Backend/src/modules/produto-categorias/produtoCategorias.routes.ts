import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createProdutoCategoriaSchema } from './produtoCategorias.schema';
import { ProdutoCategoriasController } from './produtoCategorias.controller';

const ProdutoCategoriasRouter = Router();
const controller = new ProdutoCategoriasController();

// Sem PUT: a linha é só um par de FKs, não há payload para alterar. A rota de remoção
// endereça o par, já que a associativa não tem chave substituta.
ProdutoCategoriasRouter.get
(
    '/',
    controller.ListProdutoCategoriasController
);
ProdutoCategoriasRouter.post
(
    '/',
    Validate ( createProdutoCategoriaSchema ),
    controller.CreateProdutoCategoriaController
);
ProdutoCategoriasRouter.delete
(
    '/:codProduto/:codCategoria',
    controller.RemoveProdutoCategoriaController
);

export default ProdutoCategoriasRouter;
