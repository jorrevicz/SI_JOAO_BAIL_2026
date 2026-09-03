import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createCondicaoPagamentoSchema, updateCondicaoPagamentoSchema } from './condicoesPagamento.schema';
import { CondicoesPagamentoController } from './condicoesPagamento.controller';

const CondicoesPagamentoRouter = Router();
const controller = new CondicoesPagamentoController();

CondicoesPagamentoRouter.get    ( '/',    controller.ListCondicoesController    );
CondicoesPagamentoRouter.get    ( '/:id', controller.GetByIdCondicoesController );
CondicoesPagamentoRouter.post   ( '/',    Validate ( createCondicaoPagamentoSchema ), controller.CreateCondicaoController );
CondicoesPagamentoRouter.put    ( '/:id', Validate ( updateCondicaoPagamentoSchema ), controller.UpdateCondicaoController );
CondicoesPagamentoRouter.delete ( '/:id', controller.RemoveCondicaoController  );

export default CondicoesPagamentoRouter;
