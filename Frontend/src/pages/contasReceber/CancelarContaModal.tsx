import { useState } from 'react';
import { ApiError } from '../../services/api';
import { contasReceberService, type ContaAReceber } from '../../services/contasReceber';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';

interface Props
{
  conta:      ContaAReceber;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function CancelarContaModal ( { conta, onSalvo, onCancelar }: Props )
{
  const [ justificativaCancelamento, setJustificativaCancelamento ] = useState ( '' );
  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      await contasReceberService.cancelar (
        { numero: conta.numero, modelo: conta.modelo, serie: conta.serie, parcela: conta.parcela },
        { justificativaCancelamento }
      );
      onSalvo();
    }
    catch ( err )
    {
      if ( err instanceof ApiError && err.erros )
      {
        setErrosCampo ( err.erros );
      }
      else
      {
        setErro ( ( err as Error ).message );
      }
    }
    finally
    {
      setSalvando ( false );
    }
  };

  return (
    <FormModal
      titulo="Cancelar conta a receber"
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Justificativa do cancelamento" obrigatorio colunas={ 12 } htmlFor="justificativaCancelamento" erro={ errosCampo.justificativaCancelamento }>
          <input
            id="justificativaCancelamento"
            value={ justificativaCancelamento }
            onChange={ ( evento ) => setJustificativaCancelamento ( evento.target.value ) }
            maxLength={ 255 }
            required
            autoFocus
          />
        </FormCampo>
      </FormSecao>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Voltar
        </Botao>
        <Botao type="submit" $variante="perigo" disabled={ salvando }>
          { salvando ? 'Cancelando…' : 'Confirmar cancelamento' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
