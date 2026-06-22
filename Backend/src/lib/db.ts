import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  connection: {
    statement_timeout: 30_000,
  },
});

export default sql;
