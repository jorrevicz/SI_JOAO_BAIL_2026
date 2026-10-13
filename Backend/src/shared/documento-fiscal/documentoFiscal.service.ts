import { AppError } from '../errors/AppError';
import type { DocumentoFiscalChave } from './documentoFiscal.schema';

// A chave do documento é (numero, modelo, serie) mais o que cada módulo acrescenta
// (fornecedor, cliente, parcela...): o tipo da chave completa é um parâmetro.
export type VerificarDocumentoFiscalExistente < TChave extends DocumentoFiscalChave = DocumentoFiscalChave > =
    ( chave: TChave ) => Promise < boolean >;

export async function ValidarDocumentoFiscalInexistente < TChave extends DocumentoFiscalChave >
(
    chave: TChave,
    verificarExistencia: VerificarDocumentoFiscalExistente < TChave >
): Promise < void >
{
    const jaExiste = await verificarExistencia ( chave );

    if ( jaExiste )
    {
        throw new AppError ( 'Já existe um documento cadastrado com este número, modelo e série.', 409 );
    }
}
