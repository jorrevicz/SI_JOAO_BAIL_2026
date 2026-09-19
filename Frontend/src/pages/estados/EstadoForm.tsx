import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { estadosService, type Estado, type CreateEstadoInput } from '../../services/estados';
import { paisesService, type Pais } from '../../services/paises';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { PaisConsulta } from '../paises/PaisConsulta';

interface Props
{
  inicial: Partial < Estado >;
  onSalvo: () => void;
  onCancelar: () => void;
}

export function EstadoForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateEstadoInput > ( {
    codPais: inicial.codPais ?? 0,
    uf:      inicial.uf      ?? '',
    estado:  inicial.estado  ?? '',
    isActive: inicial.isActive ?? true,
  } );
  const [ codPaisSelecionado, setCodPaisSelecionado ] = useState ( 0 )
  const [ nomePaisSelecionado, setNomePaisSelecionado ] = useState ( '' );
  const [ consultandoPais, setConsultando ] = useState ( false );

  const [ erro, setErro ] = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
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

  useEffect ( () =>
  {
    if ( inicial.codPais )
    {
      paisesService.obter ( inicial.codPais ).then ( ( oPais ) =>
      {
        setCodPaisSelecionado ( oPais.codPais );
        setNomePaisSelecionado ( oPais.pais );
      } );
    }
  });

  const handleSelecionarPais = ( oPais: Pais ) =>
  {
    setForm ( { ...form, codPais: oPais.codPais } );
    setCodPaisSelecionado ( oPais.codPais )
    setNomePaisSelecionado ( oPais.pais );
    setConsultando ( false );
  };

  return (
    <>
      <FormModal
        titulo={ editando ? 'Editar estado' : 'Novo estado' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao> 
          <FormCampo label="Nome do estado" obrigatorio colunas={ 4 } htmlFor="estado" erro={ errosCampo.estado }>
            <input
              id="estado"
              value={ form.estado }
              onChange={ ( evento ) => setForm ( { ...form, estado: evento.target.value.toLocaleUpperCase() } ) }
              maxLength={ 22 }
              required
            />
          </FormCampo>

          <FormCampo label="UF" obrigatorio colunas={ 2 } htmlFor="uf" erro={ errosCampo.uf }>
            <input
              id="uf"
              value={ form.uf }
              onChange={ ( evento ) => setForm ( { ...form, uf: evento.target.value.toUpperCase() } ) }
              maxLength={ 2 }
              required
              autoFocus
              placeholder="SP"
            />
          </FormCampo> 
        </FormSecao>

        <FormSecao>
          <FormCampo label="País" obrigatorio colunas={ 2 } erro={ errosCampo.codPais }>
            <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type="button"
                $variante="secundario"
                onClick={ () => setConsultando ( true ) }
              >
                Consultar
              </Botao> 
            </div>
          </FormCampo>

          <FormCampo label='Código do país' colunas={ 2 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input
                      disabled={ true }
                      readOnly={ true }
                      value={ codPaisSelecionado }
                    />
                  </span>
                )
              }
            </div>
          </FormCampo>

          <FormCampo label='Nome do país' colunas={ 4 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input 
                      disabled={ true }
                      readOnly={ true }
                      value={ nomePaisSelecionado }
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

      { consultandoPais && (
        <PaisConsulta
          onSelecionar={ handleSelecionarPais }
          onCancelar={ () => setConsultando ( false ) }
        />
      )}
    </>
  );
}
