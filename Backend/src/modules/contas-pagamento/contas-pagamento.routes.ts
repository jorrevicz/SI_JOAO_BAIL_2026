import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import
{
    createContasAPagarSchema,
    updateContasaPagarSchema,
    registrarBaixaContaPagarSchema,
    cancelarContaPagarSchema,
} from './contas-pagamento.schema';
import { ContasPagamentoController } from './contas-pagamento.controller';

const ContasPagamentoRouter = Router();
const controller = new ContasPagamentoController();

const ID_PATH = '/:numero/:modelo/:serie/:parcela';

ContasPagamentoRouter.get    ( '/',                       controller.ListContasController      );
ContasPagamentoRouter.get    ( ID_PATH,                   controller.GetByIdContasController   );
ContasPagamentoRouter.post   ( '/',                       Validate ( createContasAPagarSchema ),      controller.CreateContaController    );
ContasPagamentoRouter.put    ( ID_PATH,                   Validate ( updateContasaPagarSchema ),      controller.UpdateContaController    );
ContasPagamentoRouter.patch  ( `${ ID_PATH }/baixa`,      Validate ( registrarBaixaContaPagarSchema ), controller.RegistrarBaixaController );
ContasPagamentoRouter.patch  ( `${ ID_PATH }/cancelar`,   Validate ( cancelarContaPagarSchema ),       controller.CancelarContaController  );
ContasPagamentoRouter.delete ( ID_PATH,                   controller.RemoveContaController     );

export default ContasPagamentoRouter;
