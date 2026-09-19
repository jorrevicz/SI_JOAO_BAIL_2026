import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { estadosService, type Estado } from '../../services/estados';
import { cidadesService, type Cidade, type CreateCidadeInput } from '../../services/cidades';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { EstadoConsulta } from '../estados/EstadoConsulta';

interface Props
{
  inicial: Partial < Cidade >;
  onSalvo: () => void;
  onCancelar: () => void;
}

export function CidadeForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateCidadeInput > ( {
    codEstado: inicial.codEstado ?? 0,
    cidade:    inicial.cidade    ?? '',
    ddd:       inicial.ddd       ?? '',
    isActive:  inicial.isActive  ?? true,
  } );
  const [ codEstadoSel, setCodEstadoSel ] = useState ( 0 );
  const [ nomeEstadoSel, setNomeEstadoSel ] = useState ( '' );
  const [ consultando, setConsultando ] = useState ( false );
  const [ erro, setErro ] = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
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

  useEffect ( () =>
  {
    if ( inicial.codEstado )
    {
      estadosService.obter ( inicial.codEstado ).then ( ( oEstado ) =>
      {
        setCodEstadoSel ( oEstado.codEstado );
        setNomeEstadoSel ( oEstado.estado );
      } );
    }
  });

  const handleSelecionarEstado = ( oEstado: Estado ) =>
  {
    setForm ( { ...form, codEstado: oEstado.codEstado } );
    setCodEstadoSel ( oEstado.codEstado )
    setNomeEstadoSel ( oEstado.estado );
    setConsultando ( false );
  }

  return (
    <>
      <FormModal
        titulo={ editando ? 'Editar cidade' : 'Nova cidade' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Nome da cidade" obrigatorio colunas={ 4 } htmlFor="cidade" erro={ errosCampo.cidade }>
            <input
              id="cidade"
              type='text'
              value={ form.cidade }
              onChange={ ( evento ) => setForm ( { ...form, cidade: evento.target.value.toLocaleUpperCase() } ) }
              maxLength={ 32 }
              required
              autoFocus
            />
          </FormCampo>

          <FormCampo label="DDD" obrigatorio colunas={ 2 } htmlFor="ddd" erro={ errosCampo.ddd }>
            <input
              id="ddd"
              type='number'
              value={ form.ddd }
              onChange={ ( evento ) => setForm ( { ...form, ddd: evento.target.value.toLocaleUpperCase() } ) }
              maxLength={ 2 }
              placeholder="11"
              required
            />
          </FormCampo>
        </FormSecao>
        <FormSecao>
          <FormCampo label="Estado" obrigatorio colunas={ 2 } erro={ errosCampo.codEstado }>
            <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type='button'
                $variante='secundario'
                onClick={ () => setConsultando ( true ) }
              >
                Consultar
              </Botao>
            </div>
          </FormCampo>

          <FormCampo label='Código do estado' colunas={ 2 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input
                      disabled={ true }
                      readOnly={ true }
                      value={ codEstadoSel }
                    />
                  </span>
                )
              }
            </div>
          </FormCampo>

          <FormCampo label='Nome do estado' colunas={ 4 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input 
                      disabled={ true }
                      readOnly={ true }
                      value={ nomeEstadoSel }
                    />
                  </span>
                )
              }
            </div>
          </FormCampo> 

          <FormCampo label='Status' colunas={ 2 }>
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

      {
        consultando && (
          <EstadoConsulta
            onSelecionar={ handleSelecionarEstado }
            onCancelar={ () => setConsultando ( false ) }
          />
        )
      }
    </>
  );
}
