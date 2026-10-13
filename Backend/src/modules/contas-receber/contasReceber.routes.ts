import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import
{
    calcularTotalContaSchema,
    createContasAReceberSchema,
    cancelarContaReceberSchema,
} from './contasReceber.schema';
import { ContasReceberController } from './contasReceber.controller';

const ContasReceberRouter = Router();
const controller = new ContasReceberController();

const ID_PATH = '/:numero/:modelo/:serie/:codCliente/:parcela';

ContasReceberRouter.get    ( '/',                       controller.ListContasController                );
ContasReceberRouter.get    ( '/validar',                controller.ValidarChaveController              );
ContasReceberRouter.post   ( '/calcular',               Validate ( calcularTotalContaSchema ), controller.CalcularTotalController );
ContasReceberRouter.get    ( ID_PATH,                   controller.GetByIdContasController             );
ContasReceberRouter.post   ( '/',                       Validate ( createContasAReceberSchema ),        controller.CreateContaController               );
ContasReceberRouter.patch  ( `${ ID_PATH }/cancelar`,   Validate ( cancelarContaReceberSchema ),        controller.CancelarContaController             );

export default ContasReceberRouter;
