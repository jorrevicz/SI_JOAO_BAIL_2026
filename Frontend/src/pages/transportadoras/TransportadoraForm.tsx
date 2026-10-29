import { useState } from 'react';
import { veiculosService } from '../../services/veiculos';
import { ApiError } from '../../services/api';
import { transportadorasService, type Transportadora, type CreateTransportadoraInput } from '../../services/transportadoras';
import { paraDataInput, hojeParaDataInput } from '../../utils/formatters';
import { type Genero } from '../../services/clientes';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CidadeConsulta } from '../cidades/CidadeConsulta';
import { cidadesService } from '../../services/cidades';
import { VeiculoConsulta } from '../veiculos/VeiculoConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { comErroDoCampo, validarCep, validarCnpj, validarCpf, validarEmail, validarTelefone } from '../../utils/validators';


interface Props
{
  inicial:    Partial < Transportadora >;
  onSalvo:    ( salvo: Transportadora ) => void;
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
    numeroTransp:   inicial.numeroTransp   ?? undefined,
    cpfCnpjTransp:  inicial.cpfCnpjTransp  ?? '',
    inscEstTransp:  inicial.inscEstTransp  ?? '',
    bairroTransp:   inicial.bairroTransp   ?? undefined,
    cepTransp:      inicial.cepTransp      ?? '',
    foneTransp:     inicial.foneTransp     ?? '',
    foneFixo:       inicial.foneFixo       ?? undefined,
    email:          inicial.email          ?? '',
    apelido:        inicial.apelido        ?? undefined,
    rg:             inicial.rg             ?? undefined,
    dtNascimento:   paraDataInput ( inicial.dtNascimento ) || undefined,
    dtFundacao:     paraDataInput ( inicial.dtFundacao )   || undefined,
    genero:         inicial.genero         ?? undefined,
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

  const pessoaFisica   = form.tipoPessoa === 'FISICA';
  const pessoaJuridica = form.tipoPessoa === 'JURIDICA';

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
      // Só enviamos o que vale para o tipo escolhido — o Backend também descarta o resto.
      nomeFantasia:   pessoaJuridica ? form.nomeFantasia || undefined : undefined,
      dtFundacao:     pessoaJuridica ? form.dtFundacao   || undefined : undefined,
      apelido:        pessoaFisica   ? form.apelido      || undefined : undefined,
      rg:             pessoaFisica   ? form.rg           || undefined : undefined,
      dtNascimento:   pessoaFisica   ? form.dtNascimento || undefined : undefined,
      genero:         pessoaFisica   ? form.genero       || undefined : undefined,
      tipoPessoa:     form.tipoPessoa,
      enderecoTransp: form.enderecoTransp || undefined,
      numeroTransp:   form.numeroTransp   || undefined,
      cpfCnpjTransp:  form.cpfCnpjTransp,
      inscEstTransp:  form.inscEstTransp  || undefined,
      bairroTransp:   form.bairroTransp   || undefined,
      cepTransp:      form.cepTransp,
      foneTransp:     form.foneTransp,
      foneFixo:       form.foneFixo       || undefined,
      email:          form.email,
      isActive:       form.isActive       || true,
    };

    try
    {
      if ( editando )
      {
        onSalvo ( await transportadorasService.atualizar ( inicial.codTransp!, dados ) );
      }
      else
      {
        onSalvo ( await transportadorasService.criar ( dados ) );
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
        titulo={ editando ? 'Editar transportadora' : 'Nova transportadora' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Tipo de pessoa" obrigatorio colunas={ 1.8 } htmlFor="tipoPessoa" erro={ errosCampo.tipoPessoa }>
            <select
              id="tipoPessoa"
              value={ form.tipoPessoa }
              onChange={ ( evento ) =>
                setForm ( { ...form, tipoPessoa: evento.target.value.toUpperCase() as 'FISICA' | 'JURIDICA' } )
              }
              required
              autoFocus
            >
              <option value="">— Selecione —</option>
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </FormCampo>

          <FormCampo label="Transportadora" obrigatorio colunas={ 8 } htmlFor="transportadora" erro={ errosCampo.transportadora }>
            <input
              id="transportadora"
              value={ form.transportadora }
              onChange={ ( evento ) => setForm ( { ...form, transportadora: evento.target.value.toUpperCase() } ) }
              maxLength={ 128 }
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

        {
          pessoaFisica && (
            <>
              <FormSecao>
                <FormCampo label="Apelido" colunas={ 3 } htmlFor="apelido" erro={ errosCampo.apelido }>
                  <input
                    id="apelido"
                    value={ form.apelido ?? '' }
                    onChange={ ( evento ) => setForm ( { ...form, apelido: evento.target.value.toUpperCase() || undefined } ) }
                    maxLength={ 60 }
                  />
                </FormCampo>

                <FormCampo label="Data de nascimento" colunas={ 1.8 } htmlFor="dtNascimento" erro={ errosCampo.dtNascimento }>
                  <input
                    id="dtNascimento"
                    type="date"
                    value={ form.dtNascimento ?? '' }
                    max={ hojeParaDataInput() }
                    onChange={ ( evento ) => setForm ( { ...form, dtNascimento: evento.target.value || undefined } ) }
                  />
                </FormCampo>

                <FormCampo label="Gênero" colunas={ 1.8 } htmlFor="genero" erro={ errosCampo.genero }>
                  <select
                    id="genero"
                    value={ form.genero ?? '' }
                    onChange={ ( evento ) => setForm ( { ...form, genero: ( evento.target.value as Genero ) || undefined } ) }
                  >
                    <option value="">— Selecione —</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </FormCampo>
              </FormSecao>

              <FormSecao>
                <FormCampo label="RG" colunas={ 2.7 } htmlFor="rg" erro={ errosCampo.rg }>
                  <input
                    id="rg"
                    value={ form.rg ?? '' }
                    onChange={ ( evento ) => setForm ( { ...form, rg: evento.target.value.toUpperCase() || undefined } ) }
                    maxLength={ 20 }
                  />
                </FormCampo>

                <FormCampo label="CPF" colunas={ 1.8 } htmlFor="cpfCnpjTransp" erro={ errosCampo.cpfCnpjTransp }>
                  <input
                    id="cpfCnpjTransp"
                    type='text'
                    inputMode='numeric'
                    value={ form.cpfCnpjTransp }
                    onChange={ ( evento ) =>
                    {
                      setForm ( { ...form, cpfCnpjTransp: evento.target.value.replace ( /\D/g, '' ) } );
                      setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'cpfCnpjTransp', validarCpf ( evento.target.value ) ) );
                    } }
                    maxLength={ 14 }
                    placeholder="Somente dígitos"
                    required
                  />
                </FormCampo>
              </FormSecao>
            </>
          )
        }

        {
          pessoaJuridica && (
            <>
              <FormSecao>
                <FormCampo label="Nome fantasia" colunas={ 6 } htmlFor="nomeFantasia" erro={ errosCampo.nomeFantasia }>
                  <input
                    id="nomeFantasia"
                    value={ form.nomeFantasia ?? '' }
                    onChange={ ( evento ) => setForm ( { ...form, nomeFantasia: evento.target.value.toUpperCase() || undefined } ) }
                    maxLength={ 60 }
                  />
                </FormCampo>

                <FormCampo label="Data de fundação" colunas={ 2 } htmlFor="dtFundacao" erro={ errosCampo.dtFundacao }>
                  <input
                    id="dtFundacao"
                    type="date"
                    value={ form.dtFundacao ?? '' }
                    max={ hojeParaDataInput() }
                    onChange={ ( evento ) => setForm ( { ...form, dtFundacao: evento.target.value || undefined } ) }
                  />
                </FormCampo>
              </FormSecao>

              <FormSecao>
                <FormCampo label="CNPJ" colunas={ 1.8 } htmlFor="cpfCnpjTransp" erro={ errosCampo.cpfCnpjTransp }>
                  <input
                    id="cpfCnpjTransp"
                    type='text'
                    inputMode='numeric'
                    value={ form.cpfCnpjTransp }
                    onChange={ ( evento ) =>
                    {
                      setForm ( { ...form, cpfCnpjTransp: evento.target.value.replace ( /\D/g, '' ) } );
                      setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'cpfCnpjTransp', validarCnpj ( evento.target.value ) ) );
                    } }
                    maxLength={ 14 }
                    placeholder="Somente dígitos"
                  />
                </FormCampo>

                <FormCampo label="Inscrição estadual" colunas={ 5 } htmlFor="inscEstTransp" erro={ errosCampo.inscEstTransp }>
                  <input
                    id="inscEstTransp"
                    type='text'
                    value={ form.inscEstTransp }
                    onChange={ ( evento ) => setForm ( { ...form, inscEstTransp: evento.target.value } ) }
                    maxLength={ 15 }
                  />
                </FormCampo>
              </FormSecao>
            </>
          )
        }

        <FormSecao>
          <FormCampo label="Telefone (celular)" obrigatorio colunas={ 1.8 } htmlFor="foneTransp" erro={ errosCampo.foneTransp }>
            <input
              id="foneTransp"
              type='text'
              inputMode='numeric'
              value={ form.foneTransp }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, foneTransp: evento.target.value.replace ( /\D/g, '' ) } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'foneTransp', validarTelefone ( evento.target.value ) ) );
              } }
              maxLength={ 15 }
              placeholder="5511988887777"
              required
            />
          </FormCampo>

          <FormCampo label="Telefone fixo" colunas={ 1.7 } htmlFor="foneFixo" erro={ errosCampo.foneFixo }>
            <input
              id="foneFixo"
              type='text'
              inputMode='numeric'
              value={ form.foneFixo ?? '' }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, foneFixo: evento.target.value.replace ( /\D/g, '' ) || undefined } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'foneFixo', validarTelefone ( evento.target.value ) ) );
              } }
              maxLength={ 15 }
              placeholder="551133334444"
            />
          </FormCampo>

          <FormCampo label="E-mail" obrigatorio colunas={ 4 } htmlFor="email" erro={ errosCampo.email }>
            <input
              id="email"
              type='email'
              value={ form.email }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, email: evento.target.value.trim() } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'email', validarEmail ( evento.target.value.trim() ) ) );
              } }
              maxLength={ 254 }
              required
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="CEP" obrigatorio colunas={ 1.7 } htmlFor="cepTransp" erro={ errosCampo.cepTransp }>
            <input
              id="cepTransp"
              type='text'
              inputMode='numeric'
              value={ form.cepTransp }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, cepTransp: evento.target.value.replace ( /\D/g, '' ) } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'cepTransp', validarCep ( evento.target.value ) ) );
              } }
              maxLength={ 8 }
              placeholder="Somente dígitos"
              required
            />
          </FormCampo>

          <FormCampo label="Endereço" colunas={ 5 } htmlFor="enderecoTransp" erro={ errosCampo.enderecoTransp }>
            <input
              id="enderecoTransp"
              value={ form.enderecoTransp ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, enderecoTransp: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 35 }
            />
          </FormCampo>

          <FormCampo label="Número" colunas={ 1 } htmlFor="numeroTransp" erro={ errosCampo.numeroTransp }>
            <input
              id="numeroTransp"
              inputMode="numeric"
              value={ form.numeroTransp ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, numeroTransp: Number ( evento.target.value.replace ( /\D/g, '' ) ) || undefined } )
              }
              maxLength={ 6 }
            />
          </FormCampo>

          <FormCampo label="Bairro" colunas={ 4 } htmlFor="bairroTransp" erro={ errosCampo.bairroTransp }>
            <input
              id="bairroTransp"
              value={ form.bairroTransp ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, bairroTransp: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 100 }
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
            colunas={ [ 2, 1, 4 ] }
          />
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
            colunas={ [ 2, 1, 4 ] }
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
