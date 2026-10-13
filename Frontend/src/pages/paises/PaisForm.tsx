import { useState } from 'react';
import { ApiError } from '../../services/api';
import { paisesService, type Pais, type CreatePaisInput } from '../../services/paises';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';

interface Props
{
  inicial: Partial < Pais >;
  onSalvo: ( salvo: Pais ) => void;
  onCancelar: () => void;
}

export default function PaisForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreatePaisInput > ( {
    pais:     inicial.pais      ?? '',
    sigla:    inicial.sigla     ?? '',
    ddi:      inicial.ddi       ?? '',
    moeda:    inicial.moeda     ?? '',
    isActive: inicial.isActive  ?? true,
  } );
  const [ erro, setErro ] = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ] = useState ( false );

  const editando = !!inicial.codPais;

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
        onSalvo ( await paisesService.atualizar ( inicial.codPais!, form ) );
      }
      else
      {
        onSalvo ( await paisesService.criar ( form ) );
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
      titulo={ editando ? 'Editar país' : 'Novo país' }
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="País" obrigatorio colunas={ 6 } htmlFor="pais" erro={ errosCampo.pais }>
          <input
            id="pais"
            value={ form.pais }
            onChange={ ( evento ) => setForm ( { ...form, pais: evento.target.value.toLocaleUpperCase() } ) }
            maxLength={ 6 }
            required
            autoFocus
          />
        </FormCampo>

        <FormCampo label="Sigla" obrigatorio colunas={ 1 } htmlFor="sigla" erro={ errosCampo.sigla }>
          <input
            id="sigla"
            value={ form.sigla }
            onChange={ ( evento ) => setForm ( { ...form, sigla: evento.target.value.toUpperCase() } ) }
            maxLength={ 3 }
            required
          />
        </FormCampo>

        <FormCampo label="DDI" obrigatorio colunas={ 1 } htmlFor="ddi" erro={ errosCampo.ddi }>
          <input
            id="ddi"
            type='string'
            value={ form.ddi }
            onChange={ ( evento ) => setForm ( { ...form, ddi: evento.target.value } ) }
            maxLength={ 4 }
            placeholder="55"
            required
          />
        </FormCampo>

        <FormCampo label="Moeda" obrigatorio colunas={ 1 } htmlFor="moeda" erro={ errosCampo.moeda }>
          <input
            id="moeda"
            value={ form.moeda }
            onChange={ ( evento ) => setForm ( { ...form, moeda: evento.target.value.toUpperCase() } ) }
            maxLength={ 3 }
            placeholder="BRL"
            required
          />
        </FormCampo>

        <FormCampo label='Status' colunas={ 1 }>
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
