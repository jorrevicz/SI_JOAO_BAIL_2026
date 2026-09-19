import { useState } from 'react';
import { ProcedimentoConsulta } from '../procedimentos/ProcedimentoConsulta';
import { type Procedimento } from '../../services/procedimentos';
import { type ProcedimentoOdSInput } from '../../services/ordensServico';
import { FormSecao, FormCampo, Botao } from './style';

export interface ProcedimentoOdSLocal extends ProcedimentoOdSInput
{
  _uid:             string;
  nomeProcedimento: string;
}

interface Props
{
  onAdicionar: ( item: ProcedimentoOdSLocal ) => void;
}

export function ProcedimentoOdSForm ( { onAdicionar }: Props )
{
  const [ codProcedimento, setCodProcedimento ] = useState ( 0 );
  const [ nomeProcedimento, setNomeProcedimento ] = useState ( '' );
  const [ posicao, setPosicao ]     = useState ( '' );
  const [ checagem, setChecagem ]   = useState ( '' );
  const [ obsProcedimento, setObsProcedimento ] = useState ( '' );
  const [ consultando, setConsultando ] = useState ( false );
  const [ erroProcedimento, setErroProcedimento ] = useState ( '' );
  const [ erroPosicao, setErroPosicao ]   = useState ( '' );
  const [ erroChecagem, setErroChecagem ] = useState ( '' );

  const HandleSelecionarProcedimento = ( oProcedimento: Procedimento ) =>
  {
    setCodProcedimento ( oProcedimento.codProcedimento );
    setNomeProcedimento ( oProcedimento.procedimento );
    setErroProcedimento ( '' );
    setConsultando ( false );
  };

  const HandleAdicionar = () =>
  {
    let valido = true;

    if ( !codProcedimento )
    {
      setErroProcedimento ( 'Selecione um procedimento.' );
      valido = false;
    }
    else
    {
      setErroProcedimento ( '' );
    }

    if ( !posicao.trim() )
    {
      setErroPosicao ( 'Informe a posição.' );
      valido = false;
    }
    else
    {
      setErroPosicao ( '' );
    }

    if ( !checagem.trim() )
    {
      setErroChecagem ( 'Informe a checagem.' );
      valido = false;
    }
    else
    {
      setErroChecagem ( '' );
    }

    if ( !valido )
    {
      return;
    }

    onAdicionar({
      _uid: crypto.randomUUID(),
      codProcedimento,
      nomeProcedimento,
      posicao,
      checagem,
      obsProcedimento: obsProcedimento || null,
    });

    setCodProcedimento ( 0 );
    setNomeProcedimento ( '' );
    setPosicao ( '' );
    setChecagem ( '' );
    setObsProcedimento ( '' );
  };

  return (
    <>
      <FormSecao>
        <FormCampo label="Procedimento" obrigatorio colunas={ 3 } erro={ erroProcedimento }>
          <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
            <Botao
              type="button"
              $variante="secundario"
              onClick={ () => setConsultando ( true ) }
            >
              Consultar
            </Botao>
            {
              nomeProcedimento && (
                <span style={ { fontSize: '0.875rem' } }>
                  { nomeProcedimento }
                </span>
              )
            }
          </div>
        </FormCampo>

        <FormCampo label="Posição" obrigatorio colunas={ 2 } htmlFor="posicaoProcedimento" erro={ erroPosicao }>
          <input
            id="posicaoProcedimento"
            value={ posicao }
            onChange={ ( evento ) => setPosicao ( evento.target.value ) }
            maxLength={ 8 }
            placeholder="Ex.: Embaixo"
          />
        </FormCampo>

        <FormCampo label="Checagem" obrigatorio colunas={ 2 } htmlFor="checagemProcedimento" erro={ erroChecagem }>
          <input
            id="checagemProcedimento"
            value={ checagem }
            onChange={ ( evento ) => setChecagem ( evento.target.value ) }
            maxLength={ 8 }
            placeholder="Ex.: SIM"
          />
        </FormCampo>

        <FormCampo label="Observação" colunas={ 3 } htmlFor="obsProcedimento">
          <input
            id="obsProcedimento"
            value={ obsProcedimento }
            onChange={ ( evento ) => setObsProcedimento ( evento.target.value ) }
            maxLength={ 244 }
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

      {
        consultando && (
          <ProcedimentoConsulta
            onSelecionar={ HandleSelecionarProcedimento }
            onCancelar={ () => setConsultando ( false ) }
          />
        )
      }
    </>
  );
}
