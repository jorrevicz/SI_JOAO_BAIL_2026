import { useEffect, useState } from 'react';
import { type Cidade } from '../../services/cidades';
import { ApiError } from '../../services/api';
import { clientesService, type Cliente, type CreateClienteInput } from '../../services/clientes';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CidadeConsulta } from '../cidades/CidadeConsulta';
import { cidadesService } from '../../services/cidades';

interface Props
{
  inicial:    Partial < Cliente >;
  onSalvo:    () => void;
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
    isActive:     inicial.isActive     ?? true,
  });
  const [ codCidadeSel, setCodCidadeSel ] = useState ( 0 );
  const [ nomeCidadeSel, setNomeCidadeSel ]       = useState ('');
  const [ consultando, setConsultando ] = useState ( false );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ({});
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codCliente;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    const dados: CreateClienteInput =
    {
      codCidade:    form.codCidade,
      cliente:      form.cliente,
      tipoPessoa:   form.tipoPessoa,
      codCondDePag: form.codCondDePag || undefined,
      enderecoCl:   form.enderecoCl   || undefined,
      bairroCl:     form.bairroCl     || undefined,
      cepCl:        form.cepCl,
      foneCl:       form.foneCl,
      isActive:     form.isActive     || true,
    };

    try
    {
      if ( editando )
      {
        await clientesService.atualizar ( inicial.codCliente!, dados );
      }
      else
      {
        await clientesService.criar ( dados );
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
    setCodCidadeSel ( oCidade.codCidade );
    setNomeCidadeSel ( oCidade.cidade );
    setConsultando ( false );
  } 

  return (
    <>
      <FormModal
        titulo={ editando ? 'Editar cliente' : 'Novo cliente' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Cliente" obrigatorio colunas={ 8 } htmlFor="cliente" erro={ errosCampo.cliente }>
            <input
              id="cliente"
              value={ form.cliente }
              onChange={ ( evento ) => setForm ( { ...form, cliente: evento.target.value.toLocaleUpperCase() } ) }
              maxLength={ 128 }
              required
              autoFocus
            />
          </FormCampo>

          <FormCampo label="Tipo de pessoa" obrigatorio colunas={ 3 } htmlFor="tipoPessoa" erro={ errosCampo.tipoPessoa }>
            <select
              id="tipoPessoa"
              value={ form.tipoPessoa }
              onChange={ ( evento ) =>
                setForm ( { ...form, tipoPessoa: evento.target.value.toUpperCase() } )
              }
              required
            >
              <option value="">— Selecione —</option>
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="CEP" obrigatorio colunas={ 2 } htmlFor="cepCl" erro={ errosCampo.cepCl }>
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

          <FormCampo label="Endereço" colunas={ 7 } htmlFor="enderecoCl" erro={ errosCampo.enderecoCl }>
            <input
              id="enderecoCl"
              value={ form.enderecoCl ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, enderecoCl: evento.target.value.toLocaleUpperCase() || undefined } ) }
              maxLength={ 150 }
            />
          </FormCampo>

          <FormCampo label="Bairro" colunas={ 3 } htmlFor="bairroCl" erro={ errosCampo.bairroCl }>
            <input
              id="bairroCl"
              value={ form.bairroCl ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, bairroCl: evento.target.value.toLocaleUpperCase() || undefined } ) }
              maxLength={ 100 }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Cidade" obrigatorio colunas={ 2 } erro={ errosCampo.codCidade }>
            <div style={ { gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type='button'
                $variante='secundario'
                onClick={ () => setConsultando( true ) }
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
          <FormCampo label="Telefone" obrigatorio colunas={ 4 } htmlFor="foneCl" erro={ errosCampo.foneCl }>
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
      {
        consultando && (
          <CidadeConsulta
            onSelecionar={ HandleSelecionarCidade }
            onCancelar={ () => setConsultando ( false ) }
          />
        )
      }
    </>
  );
}
