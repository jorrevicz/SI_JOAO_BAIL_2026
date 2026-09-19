import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import
{
    createContasAReceberSchema,
    updateContasAReceberSchema,
    registrarPagamentoRecebidoSchema,
    cancelarContaReceberSchema,
} from './contas-receber.schema';
import { ContasReceberController } from './contas-receber.controller';

const ContasReceberRouter = Router();
const controller = new ContasReceberController();

const ID_PATH = '/:numero/:modelo/:serie/:parcela';

ContasReceberRouter.get    ( '/',                       controller.ListContasController                );
ContasReceberRouter.get    ( ID_PATH,                   controller.GetByIdContasController             );
ContasReceberRouter.post   ( '/',                       Validate ( createContasAReceberSchema ),        controller.CreateContaController               );
ContasReceberRouter.put    ( ID_PATH,                   Validate ( updateContasAReceberSchema ),        controller.UpdateContaController               );
ContasReceberRouter.patch  ( `${ ID_PATH }/baixa`,      Validate ( registrarPagamentoRecebidoSchema ),  controller.RegistrarPagamentoRecebidoController );
ContasReceberRouter.patch  ( `${ ID_PATH }/cancelar`,   Validate ( cancelarContaReceberSchema ),        controller.CancelarContaController             );
ContasReceberRouter.delete ( ID_PATH,                   controller.RemoveContaController               );

export default ContasReceberRouter;
