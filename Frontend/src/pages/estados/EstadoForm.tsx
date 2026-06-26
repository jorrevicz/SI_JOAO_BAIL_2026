import { useState } from 'react';
import { ApiError } from '../../services/api';
import { estadosService, type Estado, type CreateEstadoInput } from '../../services/estados';
import { Alerta, ModalOverlay, ModalCard, FormGroup, Campo, AcoesBotoes, Botao, ErroCampo } from './style';

interface Props
{
  inicial: Partial < Estado >;
  onSalvo: () => void;
  onCancelar: () => void;
}

export default function EstadoForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateEstadoInput > ({
    codPais: inicial.codPais ?? 0,
    uf:      inicial.uf      ?? '',
    estado:  inicial.estado  ?? '',
  });
  const [ erro, setErro ] = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ({});
  const [ salvando, setSalvando ] = useState ( false );

  const editando = !!inicial.codEstado;

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
        await estadosService.atualizar ( inicial.codEstado!, form );
      }
      else
      {
        await estadosService.criar ( form );
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
        <h3>{ editando ? 'Editar estado' : 'Novo estado' }</h3>
        { erro && <Alerta role="alert">{ erro }</Alerta> }
        <form onSubmit={ submit }>
          <FormGroup>
            <Campo>
              <label htmlFor="uf">UF *</label>
              <input
                id="uf"
                value={ form.uf }
                onChange={ ( evento ) => setForm ( { ...form, uf: evento.target.value.toUpperCase() } ) }
                maxLength={ 2 }
                required
                autoFocus
                placeholder="SP"
              />
              { errosCampo.uf && <ErroCampo>{ errosCampo.uf }</ErroCampo> }
            </Campo>
            <Campo>
              <label htmlFor="estado">Nome do estado *</label>
              <input
                id="estado"
                value={ form.estado }
                onChange={ ( evento ) => setForm ( { ...form, estado: evento.target.value } ) }
                maxLength={ 22 }
                required
              />
              { errosCampo.estado && <ErroCampo>{ errosCampo.estado }</ErroCampo> }
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
