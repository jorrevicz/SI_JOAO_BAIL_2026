import { useState } from 'react';
import { ApiError } from '../../services/api';
import { procedimentosService, type Procedimento, type CreateProcedimentoInput } from '../../services/procedimentos';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';

interface Props
{
  inicial:    Partial < Procedimento >;
  onSalvo:    ( salvo: Procedimento ) => void;
  onCancelar: () => void;
}

export default function ProcedimentoForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateProcedimentoInput >
  ( {
    procedimento: inicial.procedimento ?? '',
    isActive:     inicial.isActive     ?? true,
  } );
  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codProcedimento;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      if ( editando )
      {
        onSalvo ( await procedimentosService.atualizar ( inicial.codProcedimento!, form ) );
      }
      else
      {
        onSalvo ( await procedimentosService.criar ( form ) );
      }
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
      titulo={ editando ? 'Editar procedimento' : 'Novo procedimento' }
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Procedimento" obrigatorio colunas={ 9 } htmlFor="procedimento" erro={ errosCampo.procedimento }>
          <input
            id="procedimento"
            value={ form.procedimento }
            onChange={ ( evento ) => setForm ( { ...form, procedimento: evento.target.value } ) }
            maxLength={ 150 }
            placeholder="Ex.: Há lacres?"
            required
            autoFocus
          />
        </FormCampo>

        <FormCampo label="Status" colunas={ 3 }>
          <CaixaSelecao
            value={ form.isActive }
            onChange={ ( evento ) => setForm ( { ...form, isActive: evento } ) }
          />
        </FormCampo>
      </FormSecao>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ salvando }>
          { salvando ? 'Salvando…' : 'Salvar' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
