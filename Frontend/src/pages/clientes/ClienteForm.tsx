import { useState } from 'react';
import { type Cidade } from '../../services/cidades';
import { ApiError } from '../../services/api';
import { clientesService, type Cliente, type CreateClienteInput } from '../../services/clientes';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CidadeConsulta } from '../cidades/CidadeConsulta';

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
    tipoPessoa:   inicial.tipoPessoa   ?? undefined,
    codCondDePag: inicial.codCondDePag ?? undefined,
    enderecoCl:   inicial.enderecoCl   ?? undefined,
    bairroCl:     inicial.bairroCl     ?? undefined,
    cepCl:        inicial.cepCl        ?? undefined,
    foneCl:       inicial.foneCl       ?? undefined,
    isActive:     inicial.isActive     ?? true,
  });
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
      tipoPessoa:   form.tipoPessoa   || undefined,
      codCondDePag: form.codCondDePag || undefined,
      enderecoCl:   form.enderecoCl   || undefined,
      bairroCl:     form.bairroCl     || undefined,
      cepCl:        form.cepCl        || undefined,
      foneCl:       form.foneCl       || undefined,
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

  const HandleSelecionarCidade = ( oCidade: Cidade ) =>
  {
    setForm ( { ...form, codCidade: oCidade.codCidade } );
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

          <FormCampo label="Tipo de pessoa" colunas={ 3 } htmlFor="tipoPessoa" erro={ errosCampo.tipoPessoa }>
            <select
              id="tipoPessoa"
              value={ form.tipoPessoa ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, tipoPessoa: ( evento.target.value.toUpperCase() as 'FISICA' | 'JURIDICA' ) || undefined } )
              }
            >
              <option value="">— Selecione —</option>
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="CEP" colunas={ 2 } htmlFor="cepCl" erro={ errosCampo.cepCl }>
            <input
              id="cepCl"
              type='number'
              value={ form.cepCl ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, cepCl: evento.target.value.replace ( /\D/g, '' ) || undefined } )
              }
              maxLength={ 8 }
              placeholder="Somente dígitos"
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
          <FormCampo label="Cidade" obrigatorio colunas={ 6 } erro={ errosCampo.codCidade }>
            <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type='button'
                $variante='secundario'
                onClick={ () => setConsultando( true ) }
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
        </FormSecao>

        <FormSecao>
          <FormCampo label="Telefone" colunas={ 4 } htmlFor="foneCl" erro={ errosCampo.foneCl }>
            <input
              id="foneCl"
              value={ form.foneCl ?? '' }
              onChange={ ( evento ) =>
                setForm ( { ...form, foneCl: evento.target.value.replace ( /\D/g, '' ) || undefined } )
              }
              maxLength={ 15 }
              placeholder="Somente dígitos"
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
