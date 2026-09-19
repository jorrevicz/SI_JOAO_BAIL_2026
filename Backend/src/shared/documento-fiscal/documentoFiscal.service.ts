import { AppError } from '../errors/AppError';
import type { DocumentoFiscalChave } from './documentoFiscal.schema';

export type VerificarDocumentoFiscalExistente = ( chave: DocumentoFiscalChave ) => Promise < boolean >;

export async function ValidarDocumentoFiscalInexistente
(
    chave: DocumentoFiscalChave,
    verificarExistencia: VerificarDocumentoFiscalExistente
): Promise < void >
{
    const jaExiste = await verificarExistencia ( chave );

    if ( jaExiste )
    {
        throw new AppError ( 'Já existe um documento cadastrado com este número, modelo e série.', 409 );
    }
}
