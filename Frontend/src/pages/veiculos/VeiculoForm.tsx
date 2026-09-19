import { useEffect, useState } from 'react';
import { estadosService, type Estado } from '../../services/estados';
import { ApiError } from '../../services/api';
import { veiculosService, type Veiculo, type CreateVeiculoInput } from '../../services/veiculos';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { EstadoConsulta } from '../estados/EstadoConsulta';

interface Props
{
  inicial:    Partial < Veiculo >;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export function VeiculoForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateVeiculoInput >
  ( {
    placaVeiculo:  inicial.placaVeiculo  ?? '',
    modeloVeiculo: inicial.modeloVeiculo ?? '',
    marca:         inicial.marca         ?? '',
    codEstado:     inicial.codEstado     ?? undefined,
    placaMercoSul: inicial.placaMercoSul ?? undefined,
    codAntt:       inicial.codAntt       ?? '',
    isActive:      inicial.isActive      ?? true,
  } );
  const [ codEstadoSel, setCodEstadoSel ] = useState ( 0 );
  const [ nomeEstadoSel, setNomeEstadoSel ]   = useState ( '' );
  const [ consultando, setConsultando ]       = useState ( false );

  const [ erro, setErro ]               = useState ( '' );
  const [ errosCampo, setErrosCampo ]   = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]       = useState ( false );

  const editando = !!inicial.codVeiculo;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    const dados: CreateVeiculoInput =
    {
      placaVeiculo:  form.placaVeiculo,
      modeloVeiculo: form.modeloVeiculo,
      marca:         form.marca,
      codEstado:     form.codEstado     || undefined,
      placaMercoSul: form.placaMercoSul || undefined,
      codAntt:       form.codAntt,
      isActive:      form.isActive      || true,
    };

    try
    {
      if ( editando )
      {
        await veiculosService.atualizar ( inicial.codVeiculo!, dados );
      }
      else
      {
        await veiculosService.criar ( dados );
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

  const HandleSelecionarEstado = ( oEstado: Estado ) =>
  {
    setForm ( { ...form, codEstado: oEstado.codEstado } );
    setNomeEstadoSel ( oEstado.estado );
    setConsultando ( false );
  }

  return (
    <>
      <FormModal
        titulo={ editando ? 'Editar veículo' : 'Novo veículo' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Placa" obrigatorio colunas={ 3 } htmlFor="placaVeiculo" erro={ errosCampo.placaVeiculo }>
            <input
              id="placaVeiculo"
              type='text'
              value={ form.placaVeiculo }
              onChange={ ( evento ) =>
                setForm ( { ...form, placaVeiculo: evento.target.value.toUpperCase() } )
              }
              maxLength={ 7 }
              required
              autoFocus
              placeholder="ABC1234"
            />
          </FormCampo>

          <FormCampo label="Modelo" obrigatorio colunas={ 5 } htmlFor="modeloVeiculo" erro={ errosCampo.modeloVeiculo }>
            <input
              id="modeloVeiculo"
              value={ form.modeloVeiculo }
              onChange={ ( evento ) =>
                setForm ( { ...form, modeloVeiculo: evento.target.value.toUpperCase() } )
              }
              maxLength={ 100 }
              required
            />
          </FormCampo>

          <FormCampo label="Marca" obrigatorio colunas={ 4 } htmlFor="marca" erro={ errosCampo.marca }>
            <input
              id="marca"
              type='text'
              value={ form.marca }
              onChange={ ( evento ) =>
                setForm ( { ...form, marca: evento.target.value.toUpperCase() } )
              }
              maxLength={ 13 }
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
        </FormSecao>

        <FormSecao>
          <FormCampo label="Placa Mercosul" colunas={ 3 } htmlFor="placaMercoSul" erro={ errosCampo.placaMercoSul }>
            <input
              id="placaMercoSul"
              type='text'
              value={ form.placaMercoSul ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, placaMercoSul: evento.target.value.toUpperCase() || undefined } )
              }
              maxLength={ 7 }
            />
          </FormCampo>

          <FormCampo label="Código ANTT" obrigatorio colunas={ 3 } htmlFor="codAntt" erro={ errosCampo.codAntt }>
            <input
              id="codAntt"
              type='text'
              max={9}
              value={ form.codAntt }
              onChange={ ( evento ) =>
                setForm ( { ...form, codAntt: evento.target.value } )
              }
              required
            />
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
            onSelecionar={ HandleSelecionarEstado }
            onCancelar={ () => setConsultando ( false ) }
          />
        )
      }
    </>
  );
}
