import { Router } from 'express';
import { Validate } from '../../shared/validation/validate';
import
{
    calcularNotaFiscalSchema,
    gerarNotaFiscalSchema,
    cancelarNotaFiscalSchema,
} from './notasFiscais.schema';
import { NotasFiscaisController } from './notasFiscais.controller';

// Lote C-5 — NF-e de entrada gerada a partir da compra: consultas, prévia dos impostos,
// geração e cancelamento (operação dedicada, como em Compras). Sem edição nem exclusão.
// A nota é identificada pelas mesmas chaves da compra (mesmo segmento de rota).
const NotasFiscaisRouter = Router();
const controller = new NotasFiscaisController();

const ID_PATH = '/:numero/:modelo/:serie/:codFornecedor';

NotasFiscaisRouter.get   ( '/',                     controller.ListNotasFiscaisController   );
NotasFiscaisRouter.post  ( '/calculo',              Validate ( calcularNotaFiscalSchema ), controller.CalcularNotaFiscalController );
NotasFiscaisRouter.get   ( ID_PATH,                 controller.GetByIdNotaFiscalController  );
NotasFiscaisRouter.post  ( '/',                     Validate ( gerarNotaFiscalSchema ),    controller.GerarNotaFiscalController    );
NotasFiscaisRouter.patch ( `${ ID_PATH }/cancelar`, Validate ( cancelarNotaFiscalSchema ), controller.CancelarNotaFiscalController );

export default NotasFiscaisRouter;
