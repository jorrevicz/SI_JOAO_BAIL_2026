import { useState } from 'react';
import { veiculosService } from '../../services/veiculos';
import { ApiError } from '../../services/api';
import { transportadorasService, type Transportadora, type CreateTransportadoraInput } from '../../services/transportadoras';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CidadeConsulta } from '../cidades/CidadeConsulta';
import { cidadesService } from '../../services/cidades';
import { VeiculoConsulta } from '../veiculos/VeiculoConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';


interface Props
{
  inicial:    Partial < Transportadora >;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function TransportadoraForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateTransportadoraInput > ( {
    codCidade:      inicial.codCidade      ?? 0,
    transportadora: inicial.transportadora ?? '',
    codVeiculo:     inicial.codVeiculo     ?? undefined,
    nomeFantasia:   inicial.nomeFantasia   ?? undefined,
    tipoPessoa:     ( inicial.tipoPessoa as 'FISICA' | 'JURIDICA' ) ?? '',
    enderecoTransp: inicial.enderecoTransp ?? undefined,
    cpfCnpjTransp:  inicial.cpfCnpjTransp  ?? '',
    inscEstTransp:  inicial.inscEstTransp  ?? '',
    isActive:       inicial.isActive       ?? true,
  } );
  const campoCidade = useCampoConsulta (
    {
      codigoInicial: inicial.codCidade,
      buscar:        cidadesService.obter,
      codigoDe:      ( entidade ) => entidade.codCidade,
      descricaoDe:   ( entidade ) => entidade.cidade,
    }
  );

  const campoVeiculo = useCampoConsulta (
    {
      codigoInicial: inicial.codVeiculo,
      buscar:        veiculosService.obter,
      codigoDe:      ( entidade ) => entidade.codVeiculo,
      descricaoDe:   ( entidade ) => entidade.placaVeiculo,
    }
  );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codTransp;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    const validacoes = await Promise.all ( [ campoCidade.validar(), campoVeiculo.validar() ] );

    if ( validacoes.includes ( false ) )
    {
      setSalvando ( false );
      return;
    }

    const dados: CreateTransportadoraInput =
    {
      codCidade:      campoCidade.codigo,
      transportadora: form.transportadora,
      codVeiculo:     campoVeiculo.codigo || undefined,
      nomeFantasia:   form.nomeFantasia   || undefined,
      tipoPessoa:     form.tipoPessoa,
      enderecoTransp: form.enderecoTransp || undefined,
      cpfCnpjTransp:  form.cpfCnpjTransp,
      inscEstTransp:  form.inscEstTransp,
      isActive:       form.isActive       || true,
    };

    try
    {
      if ( editando )
      {
        await transportadorasService.atualizar ( inicial.codTransp!, dados );
      }
      else
      {
        await transportadorasService.criar ( dados );
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
        titulo={ editando ? 'Editar transportadora' : 'Nova transportadora' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Transportadora" obrigatorio colunas={ 5 } htmlFor="transportadora" erro={ errosCampo.transportadora }>
            <input
              id="transportadora"
              value={ form.transportadora }
              onChange={ ( evento ) => setForm ( { ...form, transportadora: evento.target.value.toUpperCase() } ) }
              maxLength={ 128 }
              required
              autoFocus
            />
          </FormCampo>

          <FormCampo label="Nome fantasia" colunas={ 3 } htmlFor="nomeFantasia" erro={ errosCampo.nomeFantasia }>
            <input
              id="nomeFantasia"
              value={ form.nomeFantasia ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, nomeFantasia: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 60 }
            />
          </FormCampo>

          <FormCampo label="Tipo de pessoa" obrigatorio colunas={ 2 } htmlFor="tipoPessoa" erro={ errosCampo.tipoPessoa }>
            <select
              id="tipoPessoa"
              value={ form.tipoPessoa }
              onChange={ ( evento ) =>
                setForm ( { ...form, tipoPessoa: evento.target.value.toUpperCase() as 'FISICA' | 'JURIDICA' } )
              }
              required
            >
              <option value="">— Selecione —</option>
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </FormCampo>

          <FormCampo label='Status' colunas={ 2 }>
            <CaixaSelecao
              value={ form.isActive }
              onChange={ ( evento ) => setForm ( { ...form, isActive: evento } ) }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <CampoConsulta
            campo={ campoCidade }
            Consulta={ CidadeConsulta }
            rotulo="Cidades"
            rotuloCodigo="Código da cidade"
            rotuloNome="Nome da cidade"
            obrigatorio
            erroApi={ errosCampo.codCidade }
          />
        </FormSecao>

        <FormSecao>
          <FormCampo label="Endereço" colunas={ 6 } htmlFor="enderecoTransp" erro={ errosCampo.enderecoTransp }>
            <input
              id="enderecoTransp"
              value={ form.enderecoTransp ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, enderecoTransp: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 35 }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="CPF / CNPJ" obrigatorio colunas={ 3 } htmlFor="cpfCnpjTransp" erro={ errosCampo.cpfCnpjTransp }>
            <input
              id="cpfCnpjTransp"
              type='text'
              inputMode='numeric'
              value={ form.cpfCnpjTransp }
              onChange={ ( evento ) =>
                setForm ( { ...form, cpfCnpjTransp: evento.target.value.replace ( /\D/g, '' ) } )
              }
              maxLength={ 14 }
              placeholder="Somente dígitos"
              required
            />
          </FormCampo>

          <FormCampo label="Inscrição estadual" obrigatorio colunas={ 4 } htmlFor="inscEstTransp" erro={ errosCampo.inscEstTransp }>
            <input
              id="inscEstTransp"
              type='number'
              value={ form.inscEstTransp }
              onChange={ ( evento ) => setForm ( { ...form, inscEstTransp: evento.target.value } ) }
              maxLength={ 15 }
              required
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <CampoConsulta
            campo={ campoVeiculo }
            Consulta={ VeiculoConsulta }
            rotulo="Veículos"
            rotuloCodigo="Código do veículo"
            rotuloNome="Placa do veículo"
            obrigatorio
            erroApi={ errosCampo.codVeiculo }
          />
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
