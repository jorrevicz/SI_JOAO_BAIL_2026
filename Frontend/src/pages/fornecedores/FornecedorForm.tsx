import { useState } from 'react';
import { ApiError } from '../../services/api';
import { fornecedoresService, type Fornecedor, type CreateFornecedorInput } from '../../services/fornecedores';
import { type Genero } from '../../services/clientes';
import { paraDataInput, hojeParaDataInput } from '../../utils/formatters';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CidadeConsulta } from '../cidades/CidadeConsulta';
import { cidadesService } from '../../services/cidades';
import { CondicaoPagamentoConsulta } from '../condicoesPagamento-Parcela/CondicaoPagamentoConsulta';
import { condicoesPagamentoService } from '../../services/condicoesPagamento';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { comErroDoCampo, validarCep, validarCnpj, validarCpf, validarEmail, validarTelefone } from '../../utils/validators';

interface Props
{
  inicial:    Partial < Fornecedor >;
  onSalvo:    ( salvo: Fornecedor ) => void;
  onCancelar: () => void;
}

export default function FornecedorForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateFornecedorInput > ( {
    codCidade:      inicial.codCidade      ?? 0,
    codCondDePag:   inicial.codCondDePag   ?? 0,
    fornecedor:     inicial.fornecedor     ?? '',
    nomeFantasia:   inicial.nomeFantasia   ?? '',
    apelido:        inicial.apelido        ?? undefined,
    rg:             inicial.rg             ?? undefined,
    dtNascimento:   paraDataInput ( inicial.dtNascimento ) || undefined,
    dtFundacao:     paraDataInput ( inicial.dtFundacao )   || undefined,
    genero:         inicial.genero         ?? undefined,
    foneFixo:       inicial.foneFixo       ?? undefined,
    email:          inicial.email          ?? '',
    tipoPessoa:     ( inicial.tipoPessoa as 'FISICA' | 'JURIDICA' ) ?? '',
    enderecoForn:   inicial.enderecoForn   ?? '',
    numeroForn:     inicial.numeroForn     ?? undefined,
    bairroForn:     inicial.bairroForn     ?? '',
    cepForn:        inicial.cepForn        ?? '',
    foneForn:       inicial.foneForn       ?? '',
    cpfCnpjForn:    inicial.cpfCnpjForn    ?? '',
    inscEstSubTrib: inicial.inscEstSubTrib ?? '',
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

  const campoCondPag = useCampoConsulta (
    {
      codigoInicial: inicial.codCondDePag,
      buscar:        condicoesPagamentoService.obter,
      codigoDe:      ( entidade ) => entidade.codCondDePag,
      descricaoDe:   ( entidade ) => entidade.descricao ?? '',
    }
  );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codForn;

  const pessoaFisica   = form.tipoPessoa === 'FISICA';
  const pessoaJuridica = form.tipoPessoa === 'JURIDICA';

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    const validacoes = await Promise.all ( [ campoCidade.validar(), campoCondPag.validar() ] );

    if ( validacoes.includes ( false ) )
    {
      setSalvando ( false );
      return;
    }

    const dados: CreateFornecedorInput =
    {
      codCidade:      campoCidade.codigo,
      codCondDePag:   campoCondPag.codigo,
      fornecedor:     form.fornecedor,
      // Só enviamos o que vale para o tipo escolhido — o Backend também descarta o resto.
      nomeFantasia:   pessoaJuridica ? form.nomeFantasia || undefined : undefined,
      dtFundacao:     pessoaJuridica ? form.dtFundacao   || undefined : undefined,
      apelido:        pessoaFisica   ? form.apelido      || undefined : undefined,
      rg:             pessoaFisica   ? form.rg           || undefined : undefined,
      dtNascimento:   pessoaFisica   ? form.dtNascimento || undefined : undefined,
      genero:         pessoaFisica   ? form.genero       || undefined : undefined,
      foneFixo:       form.foneFixo       || undefined,
      email:          form.email,
      tipoPessoa:     form.tipoPessoa,
      enderecoForn:   form.enderecoForn   || undefined,
      numeroForn:     form.numeroForn     || undefined,
      bairroForn:     form.bairroForn     || undefined,
      cepForn:        form.cepForn,
      foneForn:       form.foneForn,
      cpfCnpjForn:    form.cpfCnpjForn,
      inscEstSubTrib: form.inscEstSubTrib,
      isActive:       form.isActive       || true,
    };

    try
    {
      if ( editando )
      {
        onSalvo ( await fornecedoresService.atualizar ( inicial.codForn!, dados ) );
      }
      else
      {
        onSalvo ( await fornecedoresService.criar ( dados ) );
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
        titulo={ editando ? 'Editar fornecedor' : 'Novo fornecedor' }
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

          <FormCampo label="Fornecedor" obrigatorio colunas={ 10 } htmlFor="fornecedor" erro={ errosCampo.fornecedor }>
            <input
              id="fornecedor"
              value={ form.fornecedor }
              onChange={ ( evento ) => setForm ( { ...form, fornecedor: evento.target.value.toUpperCase() } ) }
              maxLength={ 128 }
              required
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

                <FormCampo label="CPF" colunas={ 1.8 } htmlFor="cpfCnpjForn" erro={ errosCampo.cpfCnpjForn }>
                  <input
                    id="cpfCnpjForn"
                    type='text'
                    inputMode='numeric'
                    value={ form.cpfCnpjForn }
                    onChange={ ( evento ) =>
                    {
                      setForm ( { ...form, cpfCnpjForn: evento.target.value.replace ( /\D/g, '' ) } );
                      setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'cpfCnpjForn', validarCpf ( evento.target.value ) ) );
                    } }
                    maxLength={ 14 }
                    placeholder="Somente dígitos"
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
                <FormCampo label="CNPJ" colunas={ 1.8 } htmlFor="cpfCnpjForn" erro={ errosCampo.cpfCnpjForn }>
                  <input
                    id="cpfCnpjForn"
                    type='text'
                    inputMode='numeric'
                    value={ form.cpfCnpjForn }
                    onChange={ ( evento ) =>
                    {
                      setForm ( { ...form, cpfCnpjForn: evento.target.value.replace ( /\D/g, '' ) } );
                      setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'cpfCnpjForn', validarCnpj ( evento.target.value ) ) );
                    } }
                    maxLength={ 14 }
                    placeholder="Somente dígitos"
                  />
                </FormCampo>

                <FormCampo label="Inscrição estadual / Sub. trib." colunas={ 5 } htmlFor="inscEstSubTrib" erro={ errosCampo.inscEstSubTrib }>
                  <input
                    id="inscEstSubTrib"
                    type='text'
                    value={ form.inscEstSubTrib }
                    onChange={ ( evento ) => setForm ( { ...form, inscEstSubTrib: evento.target.value } ) }
                    maxLength={ 15 }
                  />
                </FormCampo>
              </FormSecao>
            </>
          )
        }     

        <FormSecao>
          <FormCampo label="Telefone (celular)" obrigatorio colunas={ 1.8 } htmlFor="foneForn" erro={ errosCampo.foneForn }>
            <input
              id="foneForn"
              type='text'
              inputMode='numeric'
              value={ form.foneForn }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, foneForn: evento.target.value.replace ( /\D/g, '' ) } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'foneForn', validarTelefone ( evento.target.value ) ) );
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
          <FormCampo label="CEP" obrigatorio colunas={ 1.7 } htmlFor="cepForn" erro={ errosCampo.cepForn }>
            <input
              id="cepForn"
              type='text'
              inputMode='numeric'
              value={ form.cepForn }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, cepForn: evento.target.value.replace ( /\D/g, '' ) } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'cepForn', validarCep ( evento.target.value ) ) );
              } }
              maxLength={ 8 }
              placeholder="Somente dígitos"
              required
            />
          </FormCampo>

          <FormCampo label="Endereço" colunas={ 5 } htmlFor="enderecoForn" erro={ errosCampo.enderecoForn }>
            <input
              id="enderecoForn"
              value={ form.enderecoForn ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, enderecoForn: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 150 }
            />
          </FormCampo>

          <FormCampo label="Número" colunas={ 1 } htmlFor="numeroForn" erro={ errosCampo.numeroForn }>
            <input
              id="numeroForn"
              inputMode="numeric"
              value={ form.numeroForn ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, numeroForn: Number ( evento.target.value.replace ( /\D/g, '' ) ) || undefined } )
              }
              maxLength={ 6 }
            />
          </FormCampo>

          <FormCampo label="Bairro" colunas={ 4 } htmlFor="bairroForn" erro={ errosCampo.bairroForn }>
            <input
              id="bairroForn"
              value={ form.bairroForn ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, bairroForn: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 100 }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <CampoConsulta
            campo={ campoCidade }
            Consulta={ CidadeConsulta }
            rotulo="Cidade"
            rotuloCodigo="Código da cidade"
            rotuloNome="Nome da cidade"
            obrigatorio
            erroApi={ errosCampo.codCidade }
            colunas={ [ 2, 1, 4 ] }
          />
        </FormSecao>

        <FormSecao>
          <CampoConsulta
            campo={ campoCondPag }
            Consulta={ CondicaoPagamentoConsulta }
            rotulo="Condição de pagamento"
            rotuloCodigo="Código da condição"
            rotuloNome="Descrição da condição"
            obrigatorio
            erroApi={ errosCampo.codCondDePag }
            colunas={ [ 2, 1, 4 ] }
          />
        </FormSecao> 

        <FormSecao>
          <FormCampo label='Status' colunas={ 3 }>
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
