import type postgres from 'postgres';
import sql from '../../lib/db';

export async function withTransaction<T>(
  callback: (transaction: postgres.TransactionSql) => Promise<T>,
): Promise<T>
{
  return sql.begin(callback) as unknown as Promise<T>;
}