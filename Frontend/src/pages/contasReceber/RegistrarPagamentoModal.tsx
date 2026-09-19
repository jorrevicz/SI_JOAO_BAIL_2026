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

export default function RegistrarPagamentoModal ( { conta, onSalvo, onCancelar }: Props )
{
  const hoje = new Date().toISOString().slice ( 0, 10 );
  const [ valorBaixa, setValorBaixa ]   = useState ( conta.valor );
  const [ dtBaixa, setDtBaixa ]         = useState ( hoje );
  const [ dtPagamento, setDtPagamento ] = useState ( hoje );
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
      await contasReceberService.registrarPagamento (
        { numero: conta.numero, modelo: conta.modelo, serie: conta.serie, parcela: conta.parcela },
        { valorBaixa: Number ( valorBaixa ).toFixed ( 2 ), dtBaixa, dtPagamento }
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
      titulo="Registrar recebimento da conta a receber"
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Valor recebido" obrigatorio colunas={ 4 } htmlFor="valorBaixa" erro={ errosCampo.valorBaixa }>
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

        <FormCampo label="Data da baixa" obrigatorio colunas={ 4 } htmlFor="dtBaixa" erro={ errosCampo.dtBaixa }>
          <input
            id="dtBaixa"
            type="date"
            value={ dtBaixa }
            onChange={ ( evento ) => setDtBaixa ( evento.target.value ) }
            required
          />
        </FormCampo>

        <FormCampo label="Data do pagamento" obrigatorio colunas={ 4 } htmlFor="dtPagamento" erro={ errosCampo.dtPagamento }>
          <input
            id="dtPagamento"
            type="date"
            value={ dtPagamento }
            onChange={ ( evento ) => setDtPagamento ( evento.target.value ) }
            required
          />
        </FormCampo>
      </FormSecao>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ salvando }>
          { salvando ? 'Salvando…' : 'Confirmar recebimento' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
