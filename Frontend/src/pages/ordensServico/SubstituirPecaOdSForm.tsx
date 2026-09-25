import { useState } from 'react';
import { type SubstituirPecaOdSInput } from '../../services/ordensServico';
import { FormSecao, FormCampo, Botao } from './style';

export interface SubstituirPecaOdSLocal extends SubstituirPecaOdSInput
{
  _uid:     string;
  nomePeca: string;
}

interface Props
{
  onAdicionar: ( item: SubstituirPecaOdSLocal ) => void;
}

export function SubstituirPecaOdSForm ( { onAdicionar }: Props )
{
  const [ codPeca, setCodPeca ]     = useState ( 0 );
  const [ nomePeca, setNomePeca ]   = useState ( '' );
  const [ qtdPeca, setQtdPeca ]     = useState ( 1 );
  const [ vlrUnitarioPeca, setVlrUnitarioPeca ] = useState ( '' );
  const [ erroPeca, setErroPeca ]         = useState ( '' );
  const [ erroDescricao, setErroDescricao ] = useState ( '' );
  const [ erroQuantidade, setErroQuantidade ] = useState ( '' );
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

    if ( !qtdPeca || qtdPeca <= 0 )
    {
      setErroQuantidade ( 'A quantidade deve ser maior que zero.' );
      valido = false;
    }
    else
    {
      setErroQuantidade ( '' );
    }

    if ( !vlrUnitarioPeca || !/^[0-9]+(\.[0-9]{1,2})?$/.test ( vlrUnitarioPeca ) || Number ( vlrUnitarioPeca ) <= 0 )
    {
      setErroValor ( 'Informe o valor unitário (ex.: 89.90).' );
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
      qtdPeca,
      vlrUnitarioPeca: Number ( vlrUnitarioPeca ),
    });

    setCodPeca ( 0 );
    setNomePeca ( '' );
    setQtdPeca ( 1 );
    setVlrUnitarioPeca ( '' );
  };

  return (
    <FormSecao>
      <FormCampo label="Código da Peça" obrigatorio colunas={ 2 } htmlFor="codPecaSubstituida" erro={ erroPeca }>
        <input
          id="codPecaSubstituida"
          type="number"
          min={ 1 }
          step={ 1 }
          value={ codPeca || '' }
          onChange={ ( evento ) => setCodPeca ( Number ( evento.target.value ) ) }
        />
      </FormCampo>

      <FormCampo label="Descrição" obrigatorio colunas={ 4 } htmlFor="nomePecaSubstituida" erro={ erroDescricao }>
        <input
          id="nomePecaSubstituida"
          value={ nomePeca }
          onChange={ ( evento ) => setNomePeca ( evento.target.value ) }
          maxLength={ 20 }
        />
      </FormCampo>

      <FormCampo label="Quantidade" obrigatorio colunas={ 2 } htmlFor="qtdPecaSubstituida" erro={ erroQuantidade }>
        <input
          id="qtdPecaSubstituida"
          type="number"
          min={ 1 }
          step={ 1 }
          value={ qtdPeca }
          onChange={ ( evento ) => setQtdPeca ( Number ( evento.target.value ) ) }
        />
      </FormCampo>

      <FormCampo label="Valor Unitário" obrigatorio colunas={ 2 } htmlFor="vlrUnitarioPeca" erro={ erroValor }>
        <input
          id="vlrUnitarioPeca"
          value={ vlrUnitarioPeca }
          onChange={ ( evento ) => setVlrUnitarioPeca ( evento.target.value ) }
          placeholder="89.90"
        />
      </FormCampo>

      <FormCampo colunas={ 2 }>
        <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
          <Botao type="button" onClick={ HandleAdicionar }>
            Adicionar
          </Botao>
        </div>
      </FormCampo>
    </FormSecao>
  );
}
