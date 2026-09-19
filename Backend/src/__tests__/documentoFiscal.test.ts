import { describe, it, expect, vi } from 'vitest';
import { documentoFiscalSchema } from '../shared/documento-fiscal/documentoFiscal.schema';
import { ValidarDocumentoFiscalInexistente } from '../shared/documento-fiscal/documentoFiscal.service';
import { AppError } from '../shared/errors/AppError';

describe ( 'documentoFiscalSchema', () => {
  const chaveValida = { numero: '00012345', modelo: '01', serie: '01' };

  it ( 'aceita numero/modelo/serie no formato esperado', () => {
    const resultado = documentoFiscalSchema.safeParse ( chaveValida );

    expect ( resultado.success ).toBe ( true );
  } );

  it ( 'rejeita numero com tamanho diferente de 8 dígitos', () => {
    const resultado = documentoFiscalSchema.safeParse ( { ...chaveValida, numero: '123' } );

    expect ( resultado.success ).toBe ( false );
  } );

  it ( 'rejeita modelo com tamanho diferente de 2 dígitos', () => {
    const resultado = documentoFiscalSchema.safeParse ( { ...chaveValida, modelo: '1' } );

    expect ( resultado.success ).toBe ( false );
  } );

  it ( 'rejeita serie com tamanho diferente de 2 dígitos', () => {
    const resultado = documentoFiscalSchema.safeParse ( { ...chaveValida, serie: '123' } );

    expect ( resultado.success ).toBe ( false );
  } );

  it ( 'rejeita caracteres não numéricos', () => {
    const resultado = documentoFiscalSchema.safeParse ( { ...chaveValida, numero: '0001234A' } );

    expect ( resultado.success ).toBe ( false );
  } );
} );

describe ( 'ValidarDocumentoFiscalInexistente', () => {
  const chave = { numero: '00012345', modelo: '01', serie: '01' };

  it ( 'resolve sem erro quando o documento ainda não existe', async () => {
    const verificarExistencia = vi.fn().mockResolvedValue ( false );

    await expect
    (
      ValidarDocumentoFiscalInexistente ( chave, verificarExistencia )
    ).resolves.toBeUndefined();

    expect ( verificarExistencia ).toHaveBeenCalledWith ( chave );
  } );

  it ( 'lança AppError 409 quando já existe documento com as três chaves', async () => {
    const verificarExistencia = vi.fn().mockResolvedValue ( true );

    await expect
    (
      ValidarDocumentoFiscalInexistente ( chave, verificarExistencia )
    ).rejects.toThrow ( AppError );

    await expect
    (
      ValidarDocumentoFiscalInexistente ( chave, verificarExistencia )
    ).rejects.toMatchObject ( { status: 409 } );
  } );
} );
