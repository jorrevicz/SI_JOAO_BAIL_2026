import { useEffect, useState } from 'react';
import { type Cidade } from '../../services/cidades';
import { veiculosService, type Veiculo } from '../../services/veiculos';
import { ApiError } from '../../services/api';
import { transportadorasService, type Transportadora, type CreateTransportadoraInput } from '../../services/transportadoras';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CidadeConsulta } from '../cidades/CidadeConsulta';
import { cidadesService } from '../../services/cidades';
import { VeiculoConsulta } from '../veiculos/VeiculoConsulta';


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
  const [ codCidadeSel, setCodCidadeSel ] = useState( 0 );
  const [ nomeCidadeSel, setNomeCidadeSel ] = useState ( '' );

  const [ codVeicSel, setCodVeicSel ] = useState ( 0 );
  const [ placaVeicSel, setPlacaVeicSel ]     = useState ( '' );

  type consultaAtiva = 'cidade'| 'veic' | false;
  const [ consultando, setConsultando ] = useState < consultaAtiva > ( false );

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

    const dados: CreateTransportadoraInput =
    {
      codCidade:      form.codCidade,
      transportadora: form.transportadora,
      codVeiculo:     form.codVeiculo     || undefined,
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

  useEffect ( () =>
  {
    if ( inicial.codCidade )
    {
      cidadesService.obter ( inicial.codCidade ).then ( ( oCidade ) =>
      {
        setCodCidadeSel ( oCidade.codCidade );
        setNomeCidadeSel ( oCidade.cidade );
      } );
    }
  });

  const HandleSelecionarCidade = ( oCidade: Cidade ) =>
  {
    setForm ( { ...form, codCidade: oCidade.codCidade } );
    setNomeCidadeSel ( oCidade.cidade );
    setConsultando ( false );
  }

  useEffect ( () =>
  {
    if ( inicial.codVeiculo )
    {
      veiculosService.obter ( inicial.codVeiculo ).then ( ( oVeic ) =>
      {
        setCodVeicSel ( oVeic.codVeiculo );
        setPlacaVeicSel ( oVeic.placaVeiculo );
      } );
    }
  });

  const HandleSelecionarVeic = ( oVeic: Veiculo ) =>
  {
    setForm ( { ...form, codVeiculo: oVeic.codVeiculo } );
    setCodVeicSel ( oVeic.codVeiculo )
    setPlacaVeicSel ( oVeic.placaVeiculo );
    setConsultando ( false );
  }

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
          <FormCampo label="Cidades" obrigatorio colunas={ 2 } erro={ errosCampo.codCidade }>
            <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type='button'
                $variante='secundario'
                onClick={ () => setConsultando ( 'cidade' ) }
              >
                Consultar
              </Botao> 
            </div>
          </FormCampo>

          <FormCampo label='Código da cidade' colunas={ 2 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input
                      disabled={ true }
                      readOnly={ true }
                      value={ codCidadeSel }
                    />
                  </span>
                )
              }
            </div>
          </FormCampo>

          <FormCampo label='Nome da cidade' colunas={ 4 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input 
                      disabled={ true }
                      readOnly={ true }
                      value={ nomeCidadeSel }
                    />
                  </span>
                )
              }
            </div>
          </FormCampo>
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
          <FormCampo label="Veículos" obrigatorio colunas={ 2 } erro={ errosCampo.codVeiculo }>
            <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type='button'
                $variante='secundario'
                onClick={ () => setConsultando ( 'veic' ) }
              >
                Consultar
              </Botao> 
            </div>
          </FormCampo>

          <FormCampo label='Código do veículo' colunas={ 2 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input
                      disabled={ true }
                      readOnly={ true }
                      value={ codVeicSel }
                    />
                  </span>
                )
              }
            </div>
          </FormCampo>

          <FormCampo label='Placa do veículo' colunas={ 2 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input 
                      disabled={ true }
                      readOnly={ true }
                      value={ placaVeicSel }
                    />
                  </span>
                )
              }
            </div>
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
        consultando === 'cidade' && (
        <CidadeConsulta
          onSelecionar={ ( cidade ) =>
          {
            HandleSelecionarCidade ( cidade );
            setConsultando ( false );
          } }
          onCancelar={ () => setConsultando ( false ) }
        />
      )
    }

    {
      consultando === 'veic' && (
        <VeiculoConsulta
          onSelecionar={ ( veiculo ) =>
          {
            HandleSelecionarVeic ( veiculo );
            setConsultando ( false );
          } }
          onCancelar={ () => setConsultando ( false ) }
        />
      )
    }
    </>
  );
}
