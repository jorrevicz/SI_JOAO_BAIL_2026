import { useState } from 'react';
import { type OrcamentoPecaOdSInput } from '../../services/ordensServico';
import { FormSecao, FormCampo, Botao } from './style';

export interface OrcamentoPecaOdSLocal extends OrcamentoPecaOdSInput
{
  _uid:     string;
  nomePeca: string;
  aprovado: boolean;
}

interface Props
{
  onAdicionar: ( item: OrcamentoPecaOdSLocal ) => void;
}

export function OrcamentoPecaOdSForm ( { onAdicionar }: Props )
{
  const [ codPeca, setCodPeca ]     = useState ( 0 );
  const [ nomePeca, setNomePeca ]   = useState ( '' );
  const [ vlrPv, setVlrPv ]         = useState ( '' );
  const [ aprovado, setAprovado ]   = useState ( false );
  const [ erroPeca, setErroPeca ]         = useState ( '' );
  const [ erroDescricao, setErroDescricao ] = useState ( '' );
  const [ erroValor, setErroValor ] = useState ( '' );

  const HandleAdicionar = () =>
  {
    let valido = true;

    if ( !codPeca )
    {
      setErroPeca ( 'Informe o código da peça.' );
      valido = false;
    }
    else
    {
      setErroPeca ( '' );
    }

    if ( !nomePeca.trim() )
    {
      setErroDescricao ( 'Informe a descrição da peça.' );
      valido = false;
    }
    else
    {
      setErroDescricao ( '' );
    }

    const valorFormatado = Number ( vlrPv ).toFixed ( 2 );

    if ( !vlrPv || !/^[0-9]+(\.[0-9]{1,2})?$/.test ( vlrPv ) || Number ( vlrPv ) <= 0 )
    {
      setErroValor ( 'Informe o valor de venda (ex.: 89.90).' );
      valido = false;
    }
    else
    {
      setErroValor ( '' );
    }

    if ( !valido )
    {
      return;
    }

    onAdicionar({
      _uid: crypto.randomUUID(),
      codPeca,
      nomePeca,
      vlrPv: valorFormatado,
      aprovado,
    });

    setCodPeca ( 0 );
    setNomePeca ( '' );
    setVlrPv ( '' );
    setAprovado ( false );
  };

  return (
    <FormSecao>
      <FormCampo label="Código da Peça" obrigatorio colunas={ 2 } htmlFor="codPeca" erro={ erroPeca }>
        <input
          id="codPeca"
          type="number"
          min={ 1 }
          step={ 1 }
          value={ codPeca || '' }
          onChange={ ( evento ) => setCodPeca ( Number ( evento.target.value ) ) }
        />
      </FormCampo>

      <FormCampo label="Descrição" obrigatorio colunas={ 5 } htmlFor="nomePeca" erro={ erroDescricao }>
        <input
          id="nomePeca"
          value={ nomePeca }
          onChange={ ( evento ) => setNomePeca ( evento.target.value ) }
          maxLength={ 20 }
        />
      </FormCampo>

      <FormCampo label="Valor PV" obrigatorio colunas={ 2 } htmlFor="vlrPv" erro={ erroValor }>
        <input
          id="vlrPv"
          value={ vlrPv }
          onChange={ ( evento ) => setVlrPv ( evento.target.value ) }
          placeholder="89.90"
        />
      </FormCampo>

      <FormCampo colunas={ 3 }>
        <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
          <Botao type="button" onClick={ HandleAdicionar }>
            Adicionar
          </Botao>
        </div>
      </FormCampo>
    </FormSecao>
  );
}
