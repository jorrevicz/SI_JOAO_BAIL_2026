import { describe, it, expect, vi, beforeEach } from 'vitest';
import sql from '../lib/db';
import { WithTransaction } from '../shared/transaction/withTransaction';


vi.mock ( '../lib/db', () => ( {
  default: {
    begin: vi.fn(),
  },
}));

const mockSql = sql as unknown as { begin: ReturnType < typeof vi.fn > };

describe('WithTransaction', () => {
  beforeEach ( () => vi.clearAllMocks() );

  it('executa a função dentro de uma transação e retorna o resultado', async () => {
    mockSql.begin.mockImplementation
    (
      ( fn: (transaction: unknown) => Promise < unknown > ) => fn ({}) ,
    );

    const fn = vi.fn().mockResolvedValue ( 'resultado' );
    const result = await WithTransaction ( fn );

    expect ( mockSql.begin ).toHaveBeenCalledOnce();
    expect ( result ).toBe ( 'resultado' );
  });

  it ( 'propaga o erro quando a função falha (rollback)', async () => {
    mockSql.begin.mockImplementation
    (
      ( fn: ( transaction: unknown) => Promise < unknown > ) => fn ({}),
    );

    const fn = vi.fn().mockRejectedValue ( new Error ( 'falha na transação' ) );

    await expect ( WithTransaction ( fn ) ).rejects.toThrow ( 'falha na transação' );
  });
});