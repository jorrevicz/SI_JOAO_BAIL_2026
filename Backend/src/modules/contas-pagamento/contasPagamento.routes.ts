import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import
{
    calcularTotalContaSchema,
    createContasAPagarSchema,
} from './contasPagamento.schema';
import { ContasPagamentoController } from './contasPagamento.controller';

const ContasPagamentoRouter = Router();
const controller = new ContasPagamentoController();

const ID_PATH = '/:numero/:modelo/:serie/:codFornecedor/:parcela';

ContasPagamentoRouter.get    ( '/',                       controller.ListContasController      );
ContasPagamentoRouter.get    ( '/validar',                controller.ValidarChaveController     );
ContasPagamentoRouter.post   ( '/calcular',               Validate ( calcularTotalContaSchema ), controller.CalcularTotalController );
ContasPagamentoRouter.get    ( ID_PATH,                   controller.GetByIdContasController   );
ContasPagamentoRouter.post   ( '/',                       Validate ( createContasAPagarSchema ),      controller.CreateContaController    );

// Sem exclusão nem cancelamento por aqui: a conta a pagar só é desativada pelo cancelamento
// da compra (`PATCH /api/compras/.../cancelar`), que chama `CancelarContasDaCompra`.

export default ContasPagamentoRouter;
