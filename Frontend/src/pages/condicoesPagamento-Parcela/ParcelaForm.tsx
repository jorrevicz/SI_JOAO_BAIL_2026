import { useState } from 'react';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { FormaPagamentoConsulta } from '../formasPagamento/FormaPagamentoConsulta';
import { formasPagamentoService } from '../../services/formasPagamento';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
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
  const campoFormaPag = useCampoConsulta (
    {
      codigoInicial: null,
      buscar:        formasPagamentoService.obter,
      codigoDe:      ( formaPagamento ) => formaPagamento.codFormaDePag,
      descricaoDe:   ( formaPagamento ) => formaPagamento.formaDePag,
    }
  );
  const [ percentual, setPercentual ]       = useState ( 0 );
  const [ numDias, setNumDias ]             = useState ( 1 );
  const [ isActive, setIsActive ]           = useState ( true );
  const [ erroForma, setErroForma ]         = useState ( '' );
  const [ erroPercentual, setErroPercentual ] = useState ( '' );

  const HandleAdicionar = async () =>
  {
    let valido = true;

    // Confere no banco o código digitado à mão antes de incluí-lo na lista
    const formaEncontrada = await campoFormaPag.resolver();

    if ( !campoFormaPag.codigo )
    {
      setErroForma ( 'Selecione uma forma de pagamento.' );
      valido = false;
    }
    else
    {
      setErroForma ( '' );

      if ( !formaEncontrada )
      {
        valido = false;
      }
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

    if ( !valido || !formaEncontrada )
    {
      return;
    }

    onAdicionar({
      _uid:          crypto.randomUUID(),
      codFormaDePag: formaEncontrada.codFormaDePag,
      nomeFormaPag:  formaEncontrada.formaDePag,
      percentual,
      numDias,
      isActive,
    });

    campoFormaPag.digitar ( '' );
    setPercentual ( 0 );
    setNumDias ( 1 );
    setIsActive ( true );
  };

  return (
    <>
      <FormSecao>
        <CampoConsulta
          campo={ campoFormaPag }
          Consulta={ FormaPagamentoConsulta }
          rotulo="Forma de Pagamento"
          rotuloCodigo="Código da forma"
          rotuloNome="Descrição da forma"
          obrigatorio
          erroApi={ erroForma }
          colunas={ [ 2, 2, 3 ] }
        />

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
            <Botao type="button" onClick={ () => { void HandleAdicionar(); } }>
              Adicionar parcela
            </Botao>
          </div>
        </FormCampo>
      </FormSecao>
    </>
  );
}
