import express from 'express';
import healthRoutes from './modules/health/health.routes';
import cors from 'cors';
import { authMiddleware } from './shared/middleware/authMiddleware';
import { errorHandler } from './shared/middleware/errorHandler';
import { AppError } from './shared/errors/AppError';

const app = express();

const PORT = process.env.PORT ?? 3000;

const corsOptions = {
  origin: `http://localhost:${PORT}`,
}

app.use(express.json());

app.use(cors(corsOptions))

// Rotas públicas (sem autenticação obrigatória)
app.use('/health', healthRoutes);

// Autenticação (stub EP-03 — substituir por JWT/sessão real no EP-10)
app.use(authMiddleware);

// Módulos protegidos (adicionar aqui conforme implementados nos EP-04+)
// app.use('/api/paises', paisesRoutes);

// 404 para rotas não mapeadas
app.use((_req, _res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

// Tratamento de erros centralizado
app.use(errorHandler);

export default app;