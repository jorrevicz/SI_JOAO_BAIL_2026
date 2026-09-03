import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import { createFormaPagamentoSchema, updateFormaPagamentoSchema } from './formasPagamento.schema';
import { FormasPagamentoController } from './formasPagamento.controller';

const FormasPagamentoRouter = Router();
const controller = new FormasPagamentoController();

FormasPagamentoRouter.get    ( '/',    controller.ListFormasController    );
FormasPagamentoRouter.get    ( '/:id', controller.GetByIdFormasController );
FormasPagamentoRouter.post   ( '/',    Validate ( createFormaPagamentoSchema ), controller.CreateFormaController );
FormasPagamentoRouter.put    ( '/:id', Validate ( updateFormaPagamentoSchema ), controller.UpdateFormaController );
FormasPagamentoRouter.delete ( '/:id', controller.RemoveFormaController  );

export default FormasPagamentoRouter;
