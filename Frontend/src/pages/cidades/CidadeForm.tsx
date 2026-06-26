import { useState } from 'react';
import { ApiError } from '../../services/api';
import { cidadesService, type Cidade, type CreateCidadeInput } from '../../services/cidades';
import { Alerta, ModalOverlay, ModalCard, FormGroup, Campo, AcoesBotoes, Botao, ErroCampo } from './style';

interface Props
{
  inicial: Partial < Cidade >;
  onSalvo: () => void;
  onCancelar: () => void;
}

export default function CidadeForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateCidadeInput > ({
    codEstado: inicial.codEstado ?? 0,
    cidade:    inicial.cidade    ?? '',
    ddd:       inicial.ddd       ?? '',
  });
  const [ erro, setErro ] = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ({});
  const [ salvando, setSalvando ] = useState ( false );

  const editando = !!inicial.codCidade;

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
        await cidadesService.atualizar ( inicial.codCidade!, form );
      }
      else
      {
        await cidadesService.criar ( form );
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
        <h3>{ editando ? 'Editar cidade' : 'Nova cidade' }</h3>
        { erro && <Alerta role="alert">{ erro }</Alerta> }
        <form onSubmit={ submit }>
          <FormGroup>
            <Campo>
              <label htmlFor="cidade">Nome da cidade *</label>
              <input
                id="cidade"
                value={ form.cidade }
                onChange={ ( evento ) => setForm ( { ...form, cidade: evento.target.value } ) }
                maxLength={ 32 }
                required
                autoFocus
              />
              { errosCampo.cidade && <ErroCampo>{ errosCampo.cidade }</ErroCampo> }
            </Campo>
            <Campo>
              <label htmlFor="ddd">DDD</label>
              <input
                id="ddd"
                value={ form.ddd ?? '' }
                onChange={ ( evento ) => setForm ( { ...form, ddd: evento.target.value || undefined } ) }
                maxLength={ 2 }
                placeholder="11"
              />
              { errosCampo.ddd && <ErroCampo>{ errosCampo.ddd }</ErroCampo> }
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
