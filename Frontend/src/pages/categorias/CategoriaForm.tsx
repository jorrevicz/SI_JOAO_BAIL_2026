import { useState } from 'react';
import { ApiError } from '../../services/api';
import { categoriasService, type Categoria, type CreateCategoriaInput } from '../../services/categorias';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';

interface Props
{
  inicial:    Partial < Categoria >;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function CategoriaForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateCategoriaInput >
  ( {
    categoria: inicial.categoria ?? '',
    isActive:  inicial.isActive  ?? true,
  } );
  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codCategoria;

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
        await categoriasService.atualizar ( inicial.codCategoria!, form );
      }
      else
      {
        await categoriasService.criar ( form );
      }
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
      titulo={ editando ? 'Editar categoria' : 'Nova categoria' }
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Categoria" obrigatorio colunas={ 6 } htmlFor="categoria" erro={ errosCampo.categoria }>
          <input
            id="categoria"
            value={ form.categoria }
            onChange={ ( evento ) => setForm ( { ...form, categoria: evento.target.value.toUpperCase() } ) }
            maxLength={ 40 }
            required
            autoFocus
          />
        </FormCampo>

        <FormCampo label='Status' colunas={ 3 }>
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
