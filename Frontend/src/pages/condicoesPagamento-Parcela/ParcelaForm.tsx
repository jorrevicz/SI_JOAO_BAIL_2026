import { useState } from 'react';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { FormaPagamentoConsulta } from '../formasPagamento/FormaPagamentoConsulta';
import { type FormaPagamento } from '../../services/formasPagamento';
import { type ParcelaCondicaoInput } from '../../services/condicoesPagamento';
import { FormSecao, FormCampo, Botao } from './style';

export interface ParcelaLocal extends ParcelaCondicaoInput
{
  _uid:         string;
  nomeFormaPag: string;
}

interface Props
{
  onAdicionar: ( parcela: ParcelaLocal ) => void;
}

export function ParcelaForm ( { onAdicionar }: Props )
{
  const [ codFormaDePag, setCodFormaDePag ] = useState ( 0 );
  const [ nomeFormaPag, setNomeFormaPag ]   = useState ( '' );
  const [ percentual, setPercentual ]       = useState ( 0 );
  const [ numDias, setNumDias ]             = useState ( 1 );
  const [ isActive, setIsActive ]           = useState ( true );
  const [ consultando, setConsultando ]     = useState ( false );
  const [ erroForma, setErroForma ]         = useState ( '' );
  const [ erroPercentual, setErroPercentual ] = useState ( '' );

  const HandleSelecionarFormPag = ( oFormPag: FormaPagamento ) =>
  {
    setCodFormaDePag ( oFormPag.codFormaDePag );
    setNomeFormaPag ( oFormPag.formaDePag );
    setErroForma ( '' );
    setConsultando ( false );
  };

  const HandleAdicionar = () =>
  {
    let valido = true;

    if ( !codFormaDePag )
    {
      setErroForma ( 'Selecione uma forma de pagamento.' );
      valido = false;
    }
    else
    {
      setErroForma ( '' );
    }

    if ( percentual <= 0 )
    {
      setErroPercentual ( 'O percentual deve ser maior que zero.' );
      valido = false;
    }
    else
    {
      setErroPercentual ( '' );
    }

    if ( !valido )
    {
      return;
    }

    onAdicionar({
      _uid:          crypto.randomUUID(),
      codFormaDePag,
      nomeFormaPag,
      percentual,
      numDias,
      isActive,
    });

    setCodFormaDePag ( 0 );
    setNomeFormaPag ( '' );
    setPercentual ( 0 );
    setNumDias ( 1 );
    setIsActive ( true );
  };

  return (
    <>
      <FormSecao>
        <FormCampo label="Forma de Pagamento" obrigatorio colunas={ 3 } erro={ erroForma }>
          <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
            <Botao
              type="button"
              $variante="secundario"
              onClick={ () => setConsultando ( true ) }
            >
              Consultar
            </Botao>
            {
              nomeFormaPag && (
                <span style={ { fontSize: '0.875rem' } }>
                  { nomeFormaPag }
                </span>
              )
            }
          </div>
        </FormCampo>

        <FormCampo label="Percentual (%)" obrigatorio colunas={ 2 } htmlFor="parcelaPercentual" erro={ erroPercentual }>
          <input
            id="parcelaPercentual"
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            value={ percentual || '' }
            onChange={ ( evento ) =>
              setPercentual ( parseFloat ( evento.target.value ) || 0 )
            }
            placeholder="100.00"
          />
        </FormCampo>

        <FormCampo label="Número de dias" obrigatorio colunas={ 2 } htmlFor="parcelaNumDias">
          <input
            id="parcelaNumDias"
            type='number'
            min="1"
            step="1"
            value={ numDias }
            onChange={ ( evento ) =>
              setNumDias ( parseInt ( evento.target.value ) || 1 )
            }
            placeholder="1"
          />
        </FormCampo>

        <FormCampo label="Status" colunas={ 2 }>
          <CaixaSelecao
            value={ isActive }
            onChange={ setIsActive }
          />
        </FormCampo>

        <FormCampo colunas={ 3 }>
          <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
            <Botao type="button" onClick={ HandleAdicionar }>
              Adicionar parcela
            </Botao>
          </div>
        </FormCampo>
      </FormSecao>

      {
        consultando && (
          <FormaPagamentoConsulta
            onSelecionar={ HandleSelecionarFormPag }
            onCancelar={ () => setConsultando ( false ) }
          />
        )
      }
    </>
  );
}
