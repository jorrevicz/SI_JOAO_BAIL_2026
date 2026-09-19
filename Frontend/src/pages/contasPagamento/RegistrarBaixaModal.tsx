import { useState } from 'react';
import { ApiError } from '../../services/api';
import { contasPagamentoService, type ContaAPagar } from '../../services/contasPagamento';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';

interface Props
{
  conta:      ContaAPagar;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function RegistrarBaixaModal ( { conta, onSalvo, onCancelar }: Props )
{
  const [ valorBaixa, setValorBaixa ] = useState ( conta.valor );
  const [ dtBaixa, setDtBaixa ]       = useState ( new Date().toISOString().slice ( 0, 10 ) );
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
      await contasPagamentoService.registrarBaixa (
        { numero: conta.numero, modelo: conta.modelo, serie: conta.serie, parcela: conta.parcela },
        { valorBaixa: Number ( valorBaixa ).toFixed ( 2 ), dtBaixa }
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
      titulo="Registrar baixa da conta a pagar"
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Valor da baixa" obrigatorio colunas={ 6 } htmlFor="valorBaixa" erro={ errosCampo.valorBaixa }>
          <input
            id="valorBaixa"
            type="number"
            step="0.01"
            min="0"
            value={ valorBaixa }
            onChange={ ( evento ) => setValorBaixa ( evento.target.value ) }
            required
            autoFocus
          />
        </FormCampo>

        <FormCampo label="Data da baixa" obrigatorio colunas={ 6 } htmlFor="dtBaixa" erro={ errosCampo.dtBaixa }>
          <input
            id="dtBaixa"
            type="date"
            value={ dtBaixa }
            onChange={ ( evento ) => setDtBaixa ( evento.target.value ) }
            required
          />
        </FormCampo>
      </FormSecao>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ salvando }>
          { salvando ? 'Salvando…' : 'Confirmar baixa' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
