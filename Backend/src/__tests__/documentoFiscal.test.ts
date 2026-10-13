import { describe, it, expect, vi } from 'vitest';
import {
  documentoFiscalSchema,
  datasDocumentoFiscalSchema,
  ValidarDatasDocumentoFiscal,
  vencimentoDocumentoFiscalSchema,
  ValidarVencimentoDocumentoFiscal,
} from '../shared/documento-fiscal/documentoFiscal.schema';
import { ValidarDocumentoFiscalInexistente } from '../shared/documento-fiscal/documentoFiscal.service';
import { AppError } from '../shared/errors/AppError';

const UM_DIA = 24 * 60 * 60 * 1000;

describe ( 'documentoFiscalSchema', () => {
  const chaveValida = { numero: '000012345', modelo: '01', serie: '01' };

  it ( 'aceita numero/modelo/serie no formato esperado', () => {
    const resultado = documentoFiscalSchema.safeParse ( chaveValida );

    expect ( resultado.success ).toBe ( true );
  } );

  it ( 'rejeita numero com tamanho diferente de 9 dígitos', () => {
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
    const resultado = documentoFiscalSchema.safeParse ( { ...chaveValida, numero: '00001234A' } );

    expect ( resultado.success ).toBe ( false );
  } );
} );

describe ( 'ValidarDatasDocumentoFiscal (RN004)', () => {
  const schema = datasDocumentoFiscalSchema.superRefine ( ValidarDatasDocumentoFiscal );

  function Datas ( emissaoDiasAtras: number, chegadaDiasAtras: number )
  {
    return {
      dtEmissao: new Date ( Date.now() - emissaoDiasAtras * UM_DIA ).toISOString(),
      dtChegada: new Date ( Date.now() - chegadaDiasAtras * UM_DIA ).toISOString(),
    };
  }

  function ErrosDe ( dados: unknown )
  {
    const resultado = schema.safeParse ( dados );

    return resultado.success
      ? []
      : resultado.error.issues.map ( ( issue ) => ( { campo: issue.path[ 0 ], mensagem: issue.message } ) );
  }

  it ( 'aceita chegada igual ou posterior à emissão, ambas no passado', () => {
    expect ( ErrosDe ( Datas ( 2, 1 ) ) ).toEqual ( [] );
    expect ( ErrosDe ( Datas ( 2, 2 ) ) ).toEqual ( [] );
  } );

  it ( 'rejeita datas inválidas', () => {
    expect ( ErrosDe ( { dtEmissao: 'x', dtChegada: 'y' } ) ).toEqual
    ( [
      { campo: 'dtEmissao', mensagem: 'A data de emissão é inválida.' },
      { campo: 'dtChegada', mensagem: 'A data de chegada é inválida.' },
    ] );
  } );

  it ( 'rejeita emissão futura', () => {
    expect ( ErrosDe ( Datas ( -1, -1 ) ) ).toContainEqual
    (
      { campo: 'dtEmissao', mensagem: 'A data de emissão não pode ser futura.' }
    );
  } );

  it ( 'rejeita chegada anterior à emissão', () => {
    expect ( ErrosDe ( Datas ( 1, 2 ) ) ).toEqual
    ( [
      { campo: 'dtChegada', mensagem: 'A data de chegada não pode ser anterior à data de emissão.' },
    ] );
  } );

  it ( 'rejeita chegada futura', () => {
    expect ( ErrosDe ( Datas ( 1, -1 ) ) ).toEqual
    ( [
      { campo: 'dtChegada', mensagem: 'A data de chegada não pode ser futura.' },
    ] );
  } );
} );

describe ( 'ValidarVencimentoDocumentoFiscal (contas a pagar/receber)', () => {
  const schema = vencimentoDocumentoFiscalSchema.superRefine ( ValidarVencimentoDocumentoFiscal );

  function ErrosDe ( dados: unknown )
  {
    const resultado = schema.safeParse ( dados );

    return resultado.success
      ? []
      : resultado.error.issues.map ( ( issue ) => ( { campo: issue.path[ 0 ], mensagem: issue.message } ) );
  }

  it ( 'aceita vencimento posterior à emissão, inclusive no futuro', () => {
    expect ( ErrosDe ( { dtEmissao: '2026-09-01T10:00:00Z', dtVencimento: '2026-09-01T10:00:01Z' } ) ).toEqual ( [] );
    expect ( ErrosDe ( { dtEmissao: new Date ( Date.now() + UM_DIA ), dtVencimento: new Date ( Date.now() + 2 * UM_DIA ) } ) ).toEqual ( [] );
  } );

  it ( 'rejeita datas inválidas', () => {
    expect ( ErrosDe ( { dtEmissao: 'x', dtVencimento: 'y' } ) ).toEqual
    ( [
      { campo: 'dtEmissao',    mensagem: 'A data de emissão é inválida.' },
      { campo: 'dtVencimento', mensagem: 'A data de vencimento é inválida.' },
    ] );
  } );

  it.each
  ( [
    [ 'igual',    '2026-09-01T10:00:00Z' ],
    [ 'anterior', '2026-08-31T23:59:59Z' ],
  ] )
  ( 'rejeita vencimento %s à emissão', ( _rotulo, dtVencimento ) => {
    expect ( ErrosDe ( { dtEmissao: '2026-09-01T10:00:00Z', dtVencimento } ) ).toEqual
    ( [
      { campo: 'dtVencimento', mensagem: 'A data de vencimento não pode ser igual ou anterior à data de emissão.' },
    ] );
  } );
} );

describe ( 'ValidarDocumentoFiscalInexistente', () => {
  const chave = { numero: '000012345', modelo: '01', serie: '01' };

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
