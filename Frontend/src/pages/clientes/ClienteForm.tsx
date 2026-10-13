import { useState } from 'react';
import { ApiError } from '../../services/api';
import { clientesService, type Cliente, type CreateClienteInput, type Genero } from '../../services/clientes';
import { paraDataInput, hojeParaDataInput } from '../../utils/formatters';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CidadeConsulta } from '../cidades/CidadeConsulta';
import { cidadesService } from '../../services/cidades';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';

interface Props
{
  inicial:    Partial < Cliente >;
  onSalvo:    ( salvo: Cliente ) => void;
  onCancelar: () => void;
}

export default function ClienteForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateClienteInput >
  ({
    codCidade:    inicial.codCidade    ?? 0,
    cliente:      inicial.cliente      ?? '',
    tipoPessoa:   inicial.tipoPessoa   ?? '',
    codCondDePag: inicial.codCondDePag ?? undefined,
    enderecoCl:   inicial.enderecoCl   ?? undefined,
    bairroCl:     inicial.bairroCl     ?? undefined,
    cepCl:        inicial.cepCl        ?? '',
    foneCl:       inicial.foneCl       ?? '',
    cpfCnpjCl:    inicial.cpfCnpjCl    ?? '',
    inscEstCl:    inicial.inscEstCl    ?? '',
    foneFixo:     inicial.foneFixo     ?? undefined,
    email:        inicial.email        ?? '',
    apelido:      inicial.apelido      ?? undefined,
    nomeFantasia: inicial.nomeFantasia ?? undefined,
    rg:           inicial.rg           ?? undefined,
    dtNascimento: paraDataInput ( inicial.dtNascimento ) || undefined,
    dtFundacao:   paraDataInput ( inicial.dtFundacao )   || undefined,
    genero:       inicial.genero       ?? undefined,
    isActive:     inicial.isActive     ?? true,
  });
  const campoCidade = useCampoConsulta (
    {
      codigoInicial: inicial.codCidade,
      buscar:        cidadesService.obter,
      codigoDe:      ( entidade ) => entidade.codCidade,
      descricaoDe:   ( entidade ) => entidade.cidade,
    }
  );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ({});
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codCliente;

  const pessoaFisica   = form.tipoPessoa === 'FISICA';
  const pessoaJuridica = form.tipoPessoa === 'JURIDICA';

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    if ( !( await campoCidade.validar() ) )
    {
      setSalvando ( false );
      return;
    }

    const dados: CreateClienteInput =
    {
      codCidade:    campoCidade.codigo,
      cliente:      form.cliente,
      tipoPessoa:   form.tipoPessoa,
      codCondDePag: form.codCondDePag || undefined,
      enderecoCl:   form.enderecoCl   || undefined,
      bairroCl:     form.bairroCl     || undefined,
      cepCl:        form.cepCl,
      foneCl:       form.foneCl,
      cpfCnpjCl:    form.cpfCnpjCl,
      inscEstCl:    form.inscEstCl,
      foneFixo:     form.foneFixo     || undefined,
      email:        form.email,
      // Só enviamos o que vale para o tipo escolhido — o Backend também descarta o resto.
      apelido:      pessoaFisica   ? form.apelido      || undefined : undefined,
      rg:           pessoaFisica   ? form.rg           || undefined : undefined,
      dtNascimento: pessoaFisica   ? form.dtNascimento || undefined : undefined,
      genero:       pessoaFisica   ? form.genero       || undefined : undefined,
      nomeFantasia: pessoaJuridica ? form.nomeFantasia || undefined : undefined,
      dtFundacao:   pessoaJuridica ? form.dtFundacao   || undefined : undefined,
      isActive:     form.isActive     || true,
    };

    try
    {
      if ( editando )
      {
        onSalvo ( await clientesService.atualizar ( inicial.codCliente!, dados ) );
      }
      else
      {
        onSalvo ( await clientesService.criar ( dados ) );
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
        titulo={ editando ? 'Editar cliente' : 'Novo cliente' }
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
                setForm ( { ...form, tipoPessoa: evento.target.value.toUpperCase() } )
              }
              required
              autoFocus
            >
              <option value="">— Selecione —</option>
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </FormCampo>

          <FormCampo label="Cliente" obrigatorio colunas={ 10 } htmlFor="cliente" erro={ errosCampo.cliente }>
            <input
              id="cliente"
              value={ form.cliente }
              onChange={ ( evento ) => setForm ( { ...form, cliente: evento.target.value.toLocaleUpperCase() } ) }
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
                    onChange={ ( evento ) => setForm ( { ...form, apelido: evento.target.value.toLocaleUpperCase() || undefined } ) }
                    maxLength={ 60 }
                  />
                </FormCampo> 

                <FormCampo label="Data de nascimento" obrigatorio colunas={ 2 } htmlFor="dtNascimento" erro={ errosCampo.dtNascimento }>
                  <input
                    id="dtNascimento"
                    type="date"
                    value={ form.dtNascimento ?? '' }
                    max={ hojeParaDataInput() }
                    onChange={ ( evento ) => setForm ( { ...form, dtNascimento: evento.target.value || undefined } ) }
                    required
                  />
                </FormCampo>

                <FormCampo label="Gênero" obrigatorio colunas={ 1.8 } htmlFor="genero" erro={ errosCampo.genero }>
                  <select
                    id="genero"
                    value={ form.genero ?? '' }
                    onChange={ ( evento ) => setForm ( { ...form, genero: ( evento.target.value as Genero ) || undefined } ) }
                    required
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
                    onChange={ ( evento ) => setForm ( { ...form, rg: evento.target.value.toLocaleUpperCase() || undefined } ) }
                    maxLength={ 20 }
                  />
                </FormCampo>

                <FormCampo label="CPF" obrigatorio colunas={ 1.8 } htmlFor="cpfCnpjCl" erro={ errosCampo.cpfCnpjCl }>
                  <input
                    id="cpfCnpjCl"
                    type='text'
                    inputMode='numeric'
                    value={ form.cpfCnpjCl }
                    onChange={ ( evento ) =>
                      setForm ( { ...form, cpfCnpjCl: evento.target.value.replace ( /\D/g, '' ) } )
                    }
                    maxLength={ 14 }
                    placeholder="Somente dígitos"
                    required
                  />
                </FormCampo>

                <FormCampo label="Inscrição estadual" obrigatorio colunas={ 5 } htmlFor="inscEstCl" erro={ errosCampo.inscEstCl }>
                  <input
                    id="inscEstCl"
                    type='text'
                    value={ form.inscEstCl }
                    onChange={ ( evento ) => setForm ( { ...form, inscEstCl: evento.target.value } ) }
                    maxLength={ 15 }
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
                    onChange={ ( evento ) => setForm ( { ...form, nomeFantasia: evento.target.value.toLocaleUpperCase() || undefined } ) }
                    maxLength={ 60 }
                  />
                </FormCampo>

                <FormCampo label="Data de fundação" obrigatorio colunas={ 2 } htmlFor="dtFundacao" erro={ errosCampo.dtFundacao }>
                  <input
                    id="dtFundacao"
                    type="date"
                    value={ form.dtFundacao ?? '' }
                    max={ hojeParaDataInput() }
                    onChange={ ( evento ) => setForm ( { ...form, dtFundacao: evento.target.value || undefined } ) }
                    required
                  />
                </FormCampo>
              </FormSecao>

              <FormSecao>
                <FormCampo label="CNPJ" obrigatorio colunas={ 1.8 } htmlFor="cpfCnpjCl" erro={ errosCampo.cpfCnpjCl }>
                  <input
                    id="cpfCnpjCl"
                    type='text'
                    inputMode='numeric'
                    value={ form.cpfCnpjCl }
                    onChange={ ( evento ) =>
                      setForm ( { ...form, cpfCnpjCl: evento.target.value.replace ( /\D/g, '' ) } )
                    }
                    maxLength={ 14 }
                    placeholder="Somente dígitos"
                    required
                  />
                </FormCampo>

                <FormCampo label="Inscrição estadual" obrigatorio colunas={ 5 } htmlFor="inscEstCl" erro={ errosCampo.inscEstCl }>
                  <input
                    id="inscEstCl"
                    type='text'
                    value={ form.inscEstCl }
                    onChange={ ( evento ) => setForm ( { ...form, inscEstCl: evento.target.value } ) }
                    maxLength={ 15 }
                    required
                  />
                </FormCampo>
              </FormSecao>
            </>
          )
        }

        <FormSecao>
          <FormCampo label="Telefone (celular)" obrigatorio colunas={ 1.8 } htmlFor="foneCl" erro={ errosCampo.foneCl }>
            <input
              id="foneCl"
              type='text'
              inputMode='numeric'
              value={ form.foneCl }
              onChange={ ( evento ) =>
                setForm ( { ...form, foneCl: evento.target.value.replace ( /\D/g, '' ) } )
              }
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
                setForm ( { ...form, foneFixo: evento.target.value.replace ( /\D/g, '' ) || undefined } )
              }
              maxLength={ 15 }
              placeholder="551133334444"
            />
          </FormCampo>

          <FormCampo label="E-mail" obrigatorio colunas={ 4 } htmlFor="email" erro={ errosCampo.email }>
            <input
              id="email"
              type='email'
              value={ form.email }
              onChange={ ( evento ) => setForm ( { ...form, email: evento.target.value.trim() } ) }
              maxLength={ 254 }
              required
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="CEP" obrigatorio colunas={ 1.3 } htmlFor="cepCl" erro={ errosCampo.cepCl }>
            <input
              id="cepCl"
              type='text'
              inputMode='numeric'
              value={ form.cepCl }
              onChange={ ( evento ) =>
                setForm ( { ...form, cepCl: evento.target.value.replace ( /\D/g, '' ) } )
              }
              maxLength={ 8 }
              placeholder="Somente dígitos"
              required
            />
          </FormCampo>

          <FormCampo label="Endereço" colunas={ 6 } htmlFor="enderecoCl" erro={ errosCampo.enderecoCl }>
            <input
              id="enderecoCl"
              value={ form.enderecoCl ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, enderecoCl: evento.target.value.toLocaleUpperCase() || undefined } ) }
              maxLength={ 150 }
            />
          </FormCampo>

          <FormCampo label="Bairro" colunas={ 4 } htmlFor="bairroCl" erro={ errosCampo.bairroCl }>
            <input
              id="bairroCl"
              value={ form.bairroCl ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, bairroCl: evento.target.value.toLocaleUpperCase() || undefined } ) }
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
