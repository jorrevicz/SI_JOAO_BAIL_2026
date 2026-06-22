import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/db', () => ({
  default: {
    begin: vi.fn(),
  },
}));

import sql from '../lib/db';
import { withTransaction } from '../shared/transaction/withTransaction';

const mockSql = sql as unknown as { begin: ReturnType<typeof vi.fn> };

describe('withTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('executa a função dentro de uma transação e retorna o resultado', async () => {
    mockSql.begin.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );
    const fn = vi.fn().mockResolvedValue('resultado');

    const result = await withTransaction(fn);

    expect(mockSql.begin).toHaveBeenCalledOnce();
    expect(result).toBe('resultado');
  });

  it('propaga o erro quando a função falha (rollback)', async () => {
    mockSql.begin.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );
    const fn = vi.fn().mockRejectedValue(new Error('falha na transação'));

    await expect(withTransaction(fn)).rejects.toThrow('falha na transação');
  });
});