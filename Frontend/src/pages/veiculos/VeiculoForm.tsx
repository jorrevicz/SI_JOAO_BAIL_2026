import { useState } from 'react';
import { estadosService } from '../../services/estados';
import { ApiError } from '../../services/api';
import { veiculosService, type Veiculo, type CreateVeiculoInput } from '../../services/veiculos';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { EstadoConsulta } from '../estados/EstadoConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';

interface Props
{
  inicial:    Partial < Veiculo >;
  onSalvo:    ( salvo: Veiculo ) => void;
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
  const campoEstado = useCampoConsulta (
    {
      codigoInicial: inicial.codEstado,
      buscar:        estadosService.obter,
      codigoDe:      ( entidade ) => entidade.codEstado,
      descricaoDe:   ( entidade ) => entidade.estado,
    }
  );

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

    if ( !( await campoEstado.validar() ) )
    {
      setSalvando ( false );
      return;
    }

    const dados: CreateVeiculoInput =
    {
      placaVeiculo:  form.placaVeiculo,
      modeloVeiculo: form.modeloVeiculo,
      marca:         form.marca,
      codEstado:     campoEstado.codigo || undefined,
      placaMercoSul: form.placaMercoSul || undefined,
      codAntt:       form.codAntt,
      isActive:      form.isActive      || true,
    };

    try
    {
      if ( editando )
      {
        onSalvo ( await veiculosService.atualizar ( inicial.codVeiculo!, dados ) );
      }
      else
      {
        onSalvo ( await veiculosService.criar ( dados ) );
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
    <>
      <FormModal
        titulo={ editando ? 'Editar veículo' : 'Novo veículo' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Placa" obrigatorio colunas={ 1.5 } htmlFor="placaVeiculo" erro={ errosCampo.placaVeiculo }>
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

          <FormCampo label="Marca" obrigatorio colunas={ 2 } htmlFor="marca" erro={ errosCampo.marca }>
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
          <CampoConsulta
            campo={ campoEstado }
            Consulta={ EstadoConsulta }
            rotulo="Estado"
            rotuloCodigo="Código do estado"
            rotuloNome="Nome do estado"
            obrigatorio
            erroApi={ errosCampo.codEstado }
            colunas={ [ 2, 1, 4 ] }
          />
        </FormSecao>

        <FormSecao>
          <FormCampo label="Placa Mercosul" colunas={ 1.5 } htmlFor="placaMercoSul" erro={ errosCampo.placaMercoSul }>
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

          <FormCampo label="Código ANTT" obrigatorio colunas={ 1.7 } htmlFor="codAntt" erro={ errosCampo.codAntt }>
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
    </>
  );
}
