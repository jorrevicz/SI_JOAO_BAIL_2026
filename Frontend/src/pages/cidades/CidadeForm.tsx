import { useState } from 'react';
import { ApiError } from '../../services/api';
import { estadosService } from '../../services/estados';
import { cidadesService, type Cidade, type CreateCidadeInput } from '../../services/cidades';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { EstadoConsulta } from '../estados/EstadoConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';

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
  const campoEstado = useCampoConsulta (
    {
      codigoInicial: inicial.codEstado,
      buscar:        estadosService.obter,
      codigoDe:      ( entidade ) => entidade.codEstado,
      descricaoDe:   ( entidade ) => entidade.estado,
    }
  );

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

    if ( !( await campoEstado.validar() ) )
    {
      setSalvando ( false );
      return;
    }

    const dados: CreateCidadeInput = { ...form, codEstado: campoEstado.codigo };

    try
    {
      if ( editando )
      {
        await cidadesService.atualizar ( inicial.codCidade!, dados );
      }
      else
      {
        await cidadesService.criar ( dados );
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
          <CampoConsulta
            campo={ campoEstado }
            Consulta={ EstadoConsulta }
            rotulo="Estado"
            rotuloCodigo="Código do estado"
            rotuloNome="Nome do estado"
            obrigatorio
            erroApi={ errosCampo.codEstado }
          />

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
