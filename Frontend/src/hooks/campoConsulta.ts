import { useEffect, useState } from 'react';
import { ApiError } from '../services/api';

interface Opcoes < T >
{
  codigoInicial?: number | null;
  buscar:         ( codigo: number ) => Promise < T >;
  codigoDe:       ( entidade: T ) => number;
  descricaoDe:    ( entidade: T ) => string;
}

// Estado de um campo de consulta: o código pode ser digitado à mão ou escolhido na tela de consulta.
// A existência do código no banco é conferida ao sair do campo e, de novo, em `validar()` ao salvar.
export function useCampoConsulta < T > ( { codigoInicial, buscar, codigoDe, descricaoDe }: Opcoes < T > )
{
  const [ texto, setTexto ]       = useState ( codigoInicial ? String ( codigoInicial ) : '' );
  const [ entidade, setEntidade ] = useState < T | null > ( null );
  const [ erro, setErro ]         = useState ( '' );

  useEffect ( () =>
  {
    if ( !codigoInicial )
    {
      return;
    }

    buscar ( codigoInicial ).then ( setEntidade ).catch ( () => undefined );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ codigoInicial ] );

  const digitar = ( valor: string ) =>
  {
    setTexto ( valor.replace ( /\D/g, '' ) );
    setEntidade ( null );
    setErro ( '' );
  };

  const selecionar = ( selecionada: T ) =>
  {
    setTexto ( String ( codigoDe ( selecionada ) ) );
    setEntidade ( selecionada );
    setErro ( '' );
  };

  // Busca o código digitado no banco; retorna a entidade, ou null quando vazio ou inexistente
  // (nesse caso `erro` é preenchido).
  const resolver = async (): Promise < T | null > =>
  {
    const codigo = Number ( texto );

    if ( !codigo )
    {
      return null;
    }

    if ( entidade && codigoDe ( entidade ) === codigo )
    {
      return entidade;
    }

    try
    {
      const encontrada = await buscar ( codigo );

      setEntidade ( encontrada );
      setErro ( '' );
      return encontrada;
    }
    catch ( err )
    {
      const naoEncontrado = err instanceof ApiError && err.status === 404;
      setErro ( naoEncontrado ? `Código ${ codigo } não encontrado.` : ( err as Error ).message );
      return null;
    }
  };

  // true quando o campo está vazio ( a obrigatoriedade fica com o Backend ) ou o código existe.
  const validar = async (): Promise < boolean > =>
  {
    return !Number ( texto ) || ( await resolver() ) !== null;
  };

  return {
    texto,
    codigo:    Number ( texto ),
    entidade,
    descricao: entidade ? descricaoDe ( entidade ) : '',
    erro,
    digitar,
    selecionar,
    resolver,
    validar,
  };
}

export type CampoConsulta < T > = ReturnType < typeof useCampoConsulta < T > >;
