import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import
{
    simularCompraSchema,
    gerarParcelasSchema,
    createCompraSchema,
    cancelarCompraSchema,
} from './compras.schema';
import { ComprasController } from './compras.controller';

// Fase 4 — consultas (C-1), cadastro já lançado (a compra não tem rascunho nem edição) e
// cancelamento. Cancelar é operação dedicada (PATCH) — mesmo padrão de baixa/cancelamento
// em Contas a Pagar/Receber.
const ComprasRouter = Router();
const controller = new ComprasController();

const ID_PATH = '/:numero/:modelo/:serie/:codForn';

ComprasRouter.get    ( '/',                       controller.ListComprasController   );
ComprasRouter.get    ( '/validar',                controller.ValidarChaveController  );
ComprasRouter.post   ( '/calculo',                Validate ( simularCompraSchema ),  controller.SimularCompraController  );
ComprasRouter.post   ( '/parcelas',               Validate ( gerarParcelasSchema ),  controller.GerarParcelasController  );
ComprasRouter.get    ( ID_PATH,                   controller.GetByIdCompraController );
ComprasRouter.post   ( '/',                       Validate ( createCompraSchema ),   controller.CreateCompraController   );
ComprasRouter.patch  ( `${ ID_PATH }/cancelar`,   Validate ( cancelarCompraSchema ), controller.CancelarCompraController );

export default ComprasRouter;
