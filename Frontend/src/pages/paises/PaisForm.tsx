import { useState } from 'react';
import { ApiError } from '../../services/api';
import { paisesService, type Pais, type CreatePaisInput } from '../../services/paises';
import { Alerta, ModalOverlay, ModalCard, FormGroup, Campo, AcoesBotoes, Botao, ErroCampo } from './style';

interface Props
{
  inicial: Partial < Pais >;
  onSalvo: () => void;
  onCancelar: () => void;
}

export default function PaisForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreatePaisInput > ({
    pais:  inicial.pais  ?? '',
    sigla: inicial.sigla ?? '',
    ddi:   inicial.ddi   ?? '',
    moeda: inicial.moeda ?? '',
  });
  const [ erro, setErro ] = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ({});
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
        await paisesService.atualizar ( inicial.codPais!, form );
      }
      else
      {
        await paisesService.criar ( form );
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
    <ModalOverlay onClick={ onCancelar }>
      <ModalCard onClick={ ( evento ) => evento.stopPropagation() }>
        <h3>{ editando ? 'Editar país' : 'Novo país' }</h3>
        { erro && <Alerta role="alert">{ erro }</Alerta> }
        <form onSubmit={ submit }>
          <FormGroup>
            <Campo>
              <label htmlFor="pais">País *</label>
              <input
                id="pais"
                value={ form.pais }
                onChange={ ( evento ) => setForm ( { ...form, pais: evento.target.value } ) }
                maxLength={ 6 }
                required
                autoFocus
              />
              { errosCampo.pais && <ErroCampo>{ errosCampo.pais }</ErroCampo> }
            </Campo>
            <Campo>
              <label htmlFor="sigla">Sigla *</label>
              <input
                id="sigla"
                value={ form.sigla }
                onChange={ ( evento ) => setForm ( { ...form, sigla: evento.target.value.toUpperCase() } ) }
                maxLength={ 3 }
                required
              />
              { errosCampo.sigla && <ErroCampo>{ errosCampo.sigla }</ErroCampo> }
            </Campo>
            <Campo>
              <label htmlFor="ddi">DDI</label>
              <input
                id="ddi"
                value={ form.ddi ?? '' }
                onChange={ ( evento ) => setForm ( { ...form, ddi: evento.target.value || undefined } ) }
                maxLength={ 4 }
                placeholder="+55"
              />
              { errosCampo.ddi && <ErroCampo>{ errosCampo.ddi }</ErroCampo> }
            </Campo>
            <Campo>
              <label htmlFor="moeda">Moeda</label>
              <input
                id="moeda"
                value={ form.moeda ?? '' }
                onChange={ ( evento ) => setForm ( { ...form, moeda: evento.target.value.toUpperCase() || undefined } ) }
                maxLength={ 3 }
                placeholder="BRL"
              />
              { errosCampo.moeda && <ErroCampo>{ errosCampo.moeda }</ErroCampo> }
            </Campo>
          </FormGroup>
          <AcoesBotoes>
            <Botao type="button" $variante="secundario" onClick={ onCancelar }>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={ salvando }>
              { salvando ? 'Salvando…' : 'Salvar' }
            </Botao>
          </AcoesBotoes>
        </form>
      </ModalCard>
    </ModalOverlay>
  );
}
