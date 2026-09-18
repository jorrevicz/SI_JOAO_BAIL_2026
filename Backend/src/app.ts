import express from 'express';
import healthRoutes from './modules/health/health.routes';
import cors from 'cors';
import { AuthMiddleware } from './shared/middleware/authMiddleware';
import { ErrorHandler } from './shared/middleware/errorHandler';
import { AppError } from './shared/errors/AppError';
import PaisesRoutes     from './modules/paises/paises.routes';
import EstadosRoutes    from './modules/estados/estados.routes';
import CidadesRoutes    from './modules/cidades/cidades.routes';
import CategoriasRoutes      from './modules/categorias/categorias.routes';
import ProdutosRoutes        from './modules/produtos/produtos.routes';
import ProdutoCategoriasRoutes from './modules/produto-categorias/produtoCategorias.routes';
import VeiculosRoutes        from './modules/veiculos/veiculos.routes';
import FornecedoresRoutes    from './modules/fornecedores/fornecedores.routes';
import ClientesRoutes        from './modules/clientes/clientes.routes';
import TransportadorasRoutes from './modules/transportadoras/transportadoras.routes';
import CondicoesPagamentoRoutes from './modules/condicoes-pagamento/condicoesPagamento.routes';
import FormasPagamentoRoutes    from './modules/formas-pagamento/formasPagamento.routes';
import ParcelasRoutes           from './modules/parcelas/parcelas.routes';
import ContasPagamentoRoutes    from './modules/contas-pagamento/contas-pagamento.routes';

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
}

app.use ( express.json() );

app.use ( cors ( corsOptions ) )

// Rotas públicas (sem autenticação obrigatória)
app.use ( '/health', healthRoutes );

// Autenticação (stub EP-03 — substituir por JWT/sessão real no EP-10)
app.use ( AuthMiddleware );

// Módulos protegidos (adicionar aqui conforme implementados nos EP-04+)
app.use ( '/api/paises',      PaisesRoutes     );
app.use ( '/api/estados',     EstadosRoutes    );
app.use ( '/api/cidades',     CidadesRoutes    );
app.use ( '/api/categorias',     CategoriasRoutes      );
app.use ( '/api/produtos',       ProdutosRoutes        );
app.use ( '/api/produto-categorias', ProdutoCategoriasRoutes );
app.use ( '/api/veiculos',       VeiculosRoutes        );
app.use ( '/api/fornecedores',   FornecedoresRoutes    );
app.use ( '/api/clientes',       ClientesRoutes        );
app.use ( '/api/transportadoras',    TransportadorasRoutes );
app.use ( '/api/condicoes-pagamento', CondicoesPagamentoRoutes );
app.use ( '/api/formas-pagamento',    FormasPagamentoRoutes    );
app.use ( '/api/parcelas',            ParcelasRoutes           );
app.use ( '/api/contas-pagamento',    ContasPagamentoRoutes    );

// 404 para rotas não mapeadas
app.use 
( 
  ( _req, _res, next ) => {

    next ( new AppError ( 'Rota não encontrada', 404 ) );
  } 
);

// Tratamento de erros centralizado
app.use ( ErrorHandler );

export default app;