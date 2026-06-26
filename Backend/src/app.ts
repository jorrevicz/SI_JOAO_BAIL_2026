import express from 'express';
import healthRoutes from './modules/health/health.routes';
import cors from 'cors';
import { AuthMiddleware } from './shared/middleware/authMiddleware';
import { ErrorHandler } from './shared/middleware/errorHandler';
import { AppError } from './shared/errors/AppError';
import PaisesRoutes from './modules/paises/paises.routes';
import EstadosRoutes from './modules/estados/estados.routes';
import CidadesRoutes from './modules/cidades/cidades.routes';

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
app.use ( '/api/paises',  PaisesRoutes  );
app.use ( '/api/estados', EstadosRoutes );
app.use ( '/api/cidades', CidadesRoutes );

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