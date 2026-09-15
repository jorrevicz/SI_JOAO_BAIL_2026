import { useState } from 'react';
import { ApiError } from '../../services/api';
import { fornecedoresService, type Fornecedor, type CreateFornecedorInput } from '../../services/fornecedores';
import { type Cidade } from '../../services/cidades';
import { type CondicaoPagamento } from '../../services/condicoesPagamento';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CidadeConsulta } from '../cidades/CidadeConsulta';
import { CondicaoPagamentoConsulta } from '../condicoesPagamento-Parcela/CondicaoPagamentoConsulta';

interface Props
{
  inicial:    Partial < Fornecedor >;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function FornecedorForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateFornecedorInput > ( {
    codCidade:      inicial.codCidade      ?? 0,
    codCondDePag:   inicial.codCondDePag   ?? 0,
    fornecedor:     inicial.fornecedor     ?? '',
    nomeFantasia:   inicial.nomeFantasia   ?? '',
    tipoPessoa:     inicial.tipoPessoa     ?? undefined,
    enderecoForn:   inicial.enderecoForn   ?? '',
    bairroForn:     inicial.bairroForn     ?? '',
    cepForn:        inicial.cepForn        ?? '',
    foneForn:       inicial.foneForn       ?? '',
    cpfCnpjForn:    inicial.cpfCnpjForn    ?? '',
    inscEstSubTrib: inicial.inscEstSubTrib ?? '',
    isActive:       inicial.isActive       ?? true,
  } );
  const [ nomeCidadeSel, setNomeCidadeSel ] = useState ( '' );
  const [ consultando, setConsultando ]     = useState ( false );
  const [ descricaoCondPagSel, setDescricaoCondPagSel ] = useState ( '' );
  const [ consultandoCondPag, setConsultandoCondPag ]   = useState ( false );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codForn;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    const dados: CreateFornecedorInput =
    {
      codCidade:      form.codCidade,
      codCondDePag:   form.codCondDePag,
      fornecedor:     form.fornecedor,
      nomeFantasia:   form.nomeFantasia   || undefined,
      tipoPessoa:     form.tipoPessoa     || undefined,
      enderecoForn:   form.enderecoForn   || undefined,
      bairroForn:     form.bairroForn     || undefined,
      cepForn:        form.cepForn        || undefined,
      foneForn:       form.foneForn       || undefined,
      cpfCnpjForn:    form.cpfCnpjForn    || undefined,
      inscEstSubTrib: form.inscEstSubTrib || undefined,
      isActive:       form.isActive       || true,
    };

    try
    {
      if ( editando )
      {
        await fornecedoresService.atualizar ( inicial.codForn!, dados );
      }
      else
      {
        await fornecedoresService.criar ( dados );
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

  const handleSelecionarCidade = ( oCidade: Cidade) =>
  {
    setForm ( { ...form, codCidade: oCidade.codCidade } );
    setNomeCidadeSel ( oCidade.cidade );
    setConsultando ( false );
  }

  const handleSelecionarCondPag = ( oCondPag: CondicaoPagamento ) =>
  {
    setForm ( { ...form, codCondDePag: oCondPag.codCondDePag } );
    setDescricaoCondPagSel ( oCondPag.descricao ?? '' );
    setConsultandoCondPag ( false );
  }

  return (
    <>
      <FormModal
        titulo={ editando ? 'Editar fornecedor' : 'Novo fornecedor' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Fornecedor" obrigatorio colunas={ 6 } htmlFor="fornecedor" erro={ errosCampo.fornecedor }>
            <input
              id="fornecedor"
              value={ form.fornecedor }
              onChange={ ( evento ) => setForm ( { ...form, fornecedor: evento.target.value.toUpperCase() } ) }
              maxLength={ 128 }
              required
              autoFocus
            />
          </FormCampo>

          <FormCampo label="Nome fantasia" colunas={ 4 } htmlFor="nomeFantasia" erro={ errosCampo.nomeFantasia }>
            <input
              id="nomeFantasia"
              value={ form.nomeFantasia ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, nomeFantasia: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 60 }
            />
          </FormCampo>

          <FormCampo label="Tipo de pessoa" colunas={ 2 } htmlFor="tipoPessoa" erro={ errosCampo.tipoPessoa }>
            <select
              id="tipoPessoa"
              value={ form.tipoPessoa ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, tipoPessoa: evento.target.value.toUpperCase() || undefined } )
              }
            >
              <option value="">— Selecione —</option>
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </FormCampo>

        </FormSecao>

        <FormSecao>
          <FormCampo label="CEP" colunas={ 2 } htmlFor="cepForn" erro={ errosCampo.cepForn }>
            <input
              id="cepForn"
              type='number'
              value={ form.cepForn ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, cepForn: evento.target.value.replace ( /\D/g, '' ) || undefined } )
              }
              maxLength={ 8 }
              placeholder="Somente dígitos"
            />
          </FormCampo>

          <FormCampo label="Endereço" colunas={ 7 } htmlFor="enderecoForn" erro={ errosCampo.enderecoForn }>
            <input
              id="enderecoForn"
              value={ form.enderecoForn ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, enderecoForn: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 150 }
            />
          </FormCampo>

          <FormCampo label="Bairro" colunas={ 3 } htmlFor="bairroForn" erro={ errosCampo.bairroForn }>
            <input
              id="bairroForn"
              value={ form.bairroForn ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, bairroForn: evento.target.value.toUpperCase() || undefined } ) }
              maxLength={ 100 }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Cidade" obrigatorio colunas={ 6 } erro={ errosCampo.codCidade }>
            <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type='button'
                $variante='secundario'
                onClick={ () => setConsultando ( true ) }
              >
                Consultar
              </Botao>
              {
                nomeCidadeSel && (
                  <span style={ { fontSize: '0.875rem' } }>
                    { nomeCidadeSel }
                  </span>
                )
              }
            </div>
          </FormCampo>

          <FormCampo label="Condição de pagamento" obrigatorio colunas={ 6 } erro={ errosCampo.codCondDePag }>
            <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type='button'
                $variante='secundario'
                onClick={ () => setConsultandoCondPag ( true ) }
              >
                Consultar
              </Botao>
              {
                descricaoCondPagSel && (
                  <span style={ { fontSize: '0.875rem' } }>
                    { descricaoCondPagSel }
                  </span>
                )
              }
            </div>
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Telefone" colunas={ 3 } htmlFor="foneForn" erro={ errosCampo.foneForn }>
            <input
              id="foneForn"
              type='number'
              value={ form.foneForn ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, foneForn: evento.target.value.replace ( /\D/g, '' ) || undefined } )
              }
              maxLength={ 15 }
              placeholder="Somente dígitos"
            />
          </FormCampo>

          <FormCampo label="CPF / CNPJ" colunas={ 3 } htmlFor="cpfCnpjForn" erro={ errosCampo.cpfCnpjForn }>
            <input
              id="cpfCnpjForn"
              type='number'
              value={ form.cpfCnpjForn ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, cpfCnpjForn: evento.target.value.replace ( /\D/g, '' ) || undefined } )
              }
              maxLength={ 14 }
              placeholder="Somente dígitos"
            />
          </FormCampo>

          <FormCampo label="Inscrição estadual / Sub. trib." colunas={ 4 } htmlFor="inscEstSubTrib" erro={ errosCampo.inscEstSubTrib }>
            <input
              id="inscEstSubTrib"
              type='number'
              value={ form.inscEstSubTrib ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, inscEstSubTrib: evento.target.value || undefined } ) }
              maxLength={ 15 }
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
          <CidadeConsulta
            onSelecionar={ handleSelecionarCidade }
            onCancelar={ () => setConsultando ( false ) }
          />
        )
      }
      {
        consultandoCondPag && (
          <CondicaoPagamentoConsulta
            onSelecionar={ handleSelecionarCondPag }
            onCancelar={ () => setConsultandoCondPag ( false ) }
          />
        )
      }
    </>
  );
}
