import 'dotenv/config';
import app from './app';
import sql from './lib/db';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em localhost:${PORT}`);
});

const shutdown = async () => {
  await sql.end({ timeout: 5 });
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);