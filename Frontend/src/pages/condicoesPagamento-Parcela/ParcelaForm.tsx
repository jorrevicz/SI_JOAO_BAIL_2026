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
  onAdicionar:      ( parcela: ParcelaLocal ) => void;
  numerosExistentes: number[];
}

export function ParcelaForm ( { onAdicionar, numerosExistentes }: Props )
{
  const campoFormaPag = useCampoConsulta (
    {
      codigoInicial: null,
      buscar:        formasPagamentoService.obter,
      codigoDe:      ( formaPagamento ) => formaPagamento.codFormaDePag,
      descricaoDe:   ( formaPagamento ) => formaPagamento.formaDePag,
    }
  );
  // Número da parcela informado manualmente (sem geração automática)
  const [ numParcela, setNumParcela ]       = useState ( '' );
  const [ erroNumParcela, setErroNumParcela ] = useState ( '' );
  const [ percentual, setPercentual ]       = useState ( 0 );
  const [ numDias, setNumDias ]             = useState ( 1 );
  const [ isActive, setIsActive ]           = useState ( true );
  const [ erroForma, setErroForma ]         = useState ( '' );
  const [ erroPercentual, setErroPercentual ] = useState ( '' );

  const HandleAdicionar = async () =>
  {
    let valido = true;

    const numeroInformado = parseInt ( numParcela, 10 );

    if ( !numeroInformado || numeroInformado <= 0 )
    {
      setErroNumParcela ( 'Informe o número da parcela.' );
      valido = false;
    }
    else if ( numerosExistentes.includes ( numeroInformado ) )
    {
      setErroNumParcela ( 'Já existe uma parcela com este número.' );
      valido = false;
    }
    else
    {
      setErroNumParcela ( '' );
    }

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
      _uid:          String ( numeroInformado ),
      numParcela:    numeroInformado,
      codFormaDePag: formaEncontrada.codFormaDePag,
      nomeFormaPag:  formaEncontrada.formaDePag,
      percentual,
      numDias,
      isActive,
    });

    campoFormaPag.digitar ( '' );
    setNumParcela ( '' );
    setPercentual ( 0 );
    setNumDias ( 1 );
    setIsActive ( true );
  };

  return (
    <>
      <FormSecao>
        <FormCampo label="Nº da parcela" obrigatorio colunas={ 1 } htmlFor="parcelaNumParcela" erro={ erroNumParcela }>
          <input
            id="parcelaNumParcela"
            type="number"
            min="1"
            step="1"
            value={ numParcela }
            onChange={ ( evento ) => setNumParcela ( evento.target.value ) }
            placeholder={ String ( Math.max ( 0, ...numerosExistentes ) + 1 ) }
          />
        </FormCampo>

        <FormCampo label="Percentual (%)" obrigatorio colunas={ 1.3 } htmlFor="parcelaPercentual" erro={ erroPercentual }>
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

        <FormCampo label="Número de dias" obrigatorio colunas={ 1 } htmlFor="parcelaNumDias">
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


      </FormSecao>

      <FormSecao>
        <CampoConsulta
          campo={ campoFormaPag }
          Consulta={ FormaPagamentoConsulta }
          rotulo="Forma de Pagamento"
          rotuloCodigo="Código da forma"
          rotuloNome="Descrição da forma"
          obrigatorio
          erroApi={ erroForma }
          colunas={ [ 2, 1, 6.5 ] }
        />


        <FormCampo label="Status" colunas={ 2 }>
          <CaixaSelecao
            value={ isActive }
            onChange={ setIsActive }
          />
        </FormCampo>

        <FormCampo colunas={ 12 }>
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
