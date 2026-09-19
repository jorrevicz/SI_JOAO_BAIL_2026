import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import
{
  contasPagamentoService,
  type ContaAPagar,
  type CreateContaAPagarInput,
} from '../../services/contasPagamento';
import { type Fornecedor } from '../../services/fornecedores';
import { fornecedoresService } from '../../services/fornecedores';
import { type FormaPagamento, formasPagamentoService } from '../../services/formasPagamento';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { FornecedorConsulta } from '../fornecedores/FornecedorConsulta';
import { FormaPagamentoConsulta } from '../formasPagamento/FormaPagamentoConsulta';

interface Props
{
  inicial:    Partial < ContaAPagar >;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function ContaPagamentoForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateContaAPagarInput > ( {
    numero:        inicial.numero        ?? '',
    modelo:        inicial.modelo        ?? '',
    serie:         inicial.serie         ?? '',
    parcela:       inicial.parcela       ?? 1,
    codFornecedor: inicial.codFornecedor ?? 0,
    codFormaDePag: inicial.codFormaDePag ?? 0,
    dtEmissao:     inicial.dtEmissao     ? inicial.dtEmissao.slice ( 0, 10 )    : undefined,
    dtVencimento:  inicial.dtVencimento  ? inicial.dtVencimento.slice ( 0, 10 ) : undefined,
    valor:         inicial.valor         ?? '',
    juro:          inicial.juro          ?? '0.00',
    desconto:      inicial.desconto      ?? '0.00',
    multa:         inicial.multa         ?? '0.00',
    isActive:      inicial.isActive      ?? true,
  } );

  const [ fornecedorSel, setFornecedorSel ]     = useState < Fornecedor | null > ( null );
  const [ consultandoForn, setConsultandoForn ] = useState ( false );

  const [ formaPagSel, setFormaPagSel ]           = useState < FormaPagamento | null > ( null );
  const [ consultandoFormaPag, setConsultandoFormaPag ] = useState ( false );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!( inicial.numero && inicial.modelo && inicial.serie && inicial.parcela );

  // A chave (numero/modelo/serie) precisa ser validada — formato e inexistência prévia —
  // antes de liberar a edição dos demais campos (ver docs/02-arquitetura.md).
  const [ chaveValidada, setChaveValidada ] = useState ( editando );
  const [ validandoChave, setValidandoChave ] = useState ( false );
  const [ erroChave, setErroChave ]           = useState ( '' );

  const AlterarChave = ( campo: 'numero' | 'modelo' | 'serie', valor: string ) =>
  {
    setForm ( { ...form, [ campo ]: valor } );
    setChaveValidada ( false );
    setErroChave ( '' );
  };

  const ValidarChave = async () =>
  {
    setValidandoChave ( true );
    setErroChave ( '' );
    setErrosCampo ( {} );

    try
    {
      await contasPagamentoService.validarChave ( { numero: form.numero, modelo: form.modelo, serie: form.serie } );
      setChaveValidada ( true );
    }
    catch ( err )
    {
      if ( err instanceof ApiError && err.erros )
      {
        setErrosCampo ( err.erros );
      }
      else
      {
        setErroChave ( ( err as Error ).message );
      }
    }
    finally
    {
      setValidandoChave ( false );
    }
  };

  useEffect ( () =>
  {
    if ( inicial.codFornecedor )
    {
      fornecedoresService.obter ( inicial.codFornecedor ).then ( setFornecedorSel );
    }
  }, [ inicial.codFornecedor ] );

  useEffect ( () =>
  {
    if ( inicial.codFormaDePag )
    {
      formasPagamentoService.obter ( inicial.codFormaDePag ).then ( setFormaPagSel );
    }
  }, [ inicial.codFormaDePag ] );

  const HandleSelecionarFornecedor = ( oForn: Fornecedor ) =>
  {
    setForm ( { ...form, codFornecedor: oForn.codForn } );
    setFornecedorSel ( oForn );
    setConsultandoForn ( false );
  };

  const HandleSelecionarFormaPag = ( oFormaPag: FormaPagamento ) =>
  {
    setForm ( { ...form, codFormaDePag: oFormaPag.codFormaDePag } );
    setFormaPagSel ( oFormaPag );
    setConsultandoFormaPag ( false );
  };

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    const dados: CreateContaAPagarInput =
    {
      numero:        form.numero,
      modelo:        form.modelo,
      serie:         form.serie,
      parcela:       form.parcela,
      codFornecedor: form.codFornecedor,
      codFormaDePag: form.codFormaDePag,
      dtEmissao:     form.dtEmissao    || undefined,
      dtVencimento:  form.dtVencimento || undefined,
      valor:         Number ( form.valor ).toFixed ( 2 ),
      juro:          Number ( form.juro ).toFixed ( 2 ),
      desconto:      Number ( form.desconto ).toFixed ( 2 ),
      multa:         Number ( form.multa ).toFixed ( 2 ),
      isActive:      form.isActive,
    };

    try
    {
      if ( editando )
      {
        await contasPagamentoService.atualizar (
          { numero: inicial.numero!, modelo: inicial.modelo!, serie: inicial.serie!, parcela: inicial.parcela! },
          dados
        );
      }
      else
      {
        await contasPagamentoService.criar ( dados );
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
        titulo={ editando ? 'Editar conta a pagar' : 'Nova conta a pagar' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Número" obrigatorio colunas={ 3 } htmlFor="numero" erro={ errosCampo.numero }>
            <input
              id="numero"
              value={ form.numero }
              onChange={ ( evento ) => AlterarChave ( 'numero', evento.target.value.replace ( /\D/g, '' ) ) }
              maxLength={ 8 }
              placeholder="8 dígitos"
              disabled={ editando || chaveValidada }
              readOnly={ editando || chaveValidada }
              required
              autoFocus
            />
          </FormCampo>

          <FormCampo label="Modelo" obrigatorio colunas={ 2 } htmlFor="modelo" erro={ errosCampo.modelo }>
            <input
              id="modelo"
              value={ form.modelo }
              onChange={ ( evento ) => AlterarChave ( 'modelo', evento.target.value.replace ( /\D/g, '' ) ) }
              maxLength={ 2 }
              placeholder="2 dígitos"
              disabled={ editando || chaveValidada }
              readOnly={ editando || chaveValidada }
              required
            />
          </FormCampo>

          <FormCampo label="Série" obrigatorio colunas={ 2 } htmlFor="serie" erro={ errosCampo.serie }>
            <input
              id="serie"
              value={ form.serie }
              onChange={ ( evento ) => AlterarChave ( 'serie', evento.target.value.replace ( /\D/g, '' ) ) }
              maxLength={ 2 }
              placeholder="2 dígitos"
              disabled={ editando || chaveValidada }
              readOnly={ editando || chaveValidada }
              required
            />
          </FormCampo>

          <FormCampo label="Parcela" obrigatorio colunas={ 2 } htmlFor="parcela" erro={ errosCampo.parcela }>
            <input
              id="parcela"
              type="number"
              min="1"
              value={ form.parcela }
              onChange={ ( evento ) => setForm ( { ...form, parcela: Number ( evento.target.value ) } ) }
              disabled={ editando || chaveValidada }
              readOnly={ editando || chaveValidada }
              required
            />
          </FormCampo>

          {
            !editando && (
              <FormCampo label="Chave do documento" colunas={ 3 } erro={ erroChave }>
                <Botao
                  type="button"
                  $variante={ chaveValidada ? 'secundario' : undefined }
                  onClick={ ValidarChave }
                  disabled={ chaveValidada }
                >
                  { chaveValidada ? 'Chave validada ✓' : validandoChave ? 'Validando…' : 'Validar chave' }
                </Botao>
              </FormCampo>
            )
          }
        </FormSecao> 

        <FormSecao>
          <FormCampo label="Fornecedor" obrigatorio colunas={ 3 } erro={ errosCampo.codFornecedor }>
            <Botao
              type="button"
              $variante="secundario"
              onClick={ () => setConsultandoForn ( true ) }
              disabled={ !editando && !chaveValidada }
            >
              Consultar
            </Botao>
          </FormCampo>

          <FormCampo label="Código do fornecedor" colunas={ 2 }>
            <input disabled readOnly value={ form.codFornecedor || '' } />
          </FormCampo>

          <FormCampo label="Nome do fornecedor" colunas={ 5 }>
            <input disabled readOnly value={ fornecedorSel?.fornecedor ?? '' } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Forma de pagamento" obrigatorio colunas={ 3 } erro={ errosCampo.codFormaDePag }>
            <Botao
              type="button"
              $variante="secundario"
              onClick={ () => setConsultandoFormaPag ( true ) }
              disabled={ !editando && !chaveValidada }
            >
              Consultar
            </Botao>
          </FormCampo>

          <FormCampo label="Código da forma" colunas={ 2 }>
            <input disabled readOnly value={ form.codFormaDePag || '' } />
          </FormCampo>

          <FormCampo label="Descrição da forma" colunas={ 5 }>
            <input disabled readOnly value={ formaPagSel?.formaDePag ?? '' } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Data de emissão" colunas={ 3 } htmlFor="dtEmissao" erro={ errosCampo.dtEmissao }>
            <input
              id="dtEmissao"
              type="date"
              value={ form.dtEmissao ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, dtEmissao: evento.target.value || undefined } ) }
              disabled={ !editando && !chaveValidada }
            />
          </FormCampo>

          <FormCampo label="Data de vencimento" colunas={ 3 } htmlFor="dtVencimento" erro={ errosCampo.dtVencimento }>
            <input
              id="dtVencimento"
              type="date"
              value={ form.dtVencimento ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, dtVencimento: evento.target.value || undefined } ) }
              disabled={ !editando && !chaveValidada }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Valor" obrigatorio colunas={ 2 } htmlFor="valor" erro={ errosCampo.valor }>
            <input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={ form.valor }
              onChange={ ( evento ) => setForm ( { ...form, valor: evento.target.value } ) }
              placeholder="0.00"
              required
              disabled={ !editando && !chaveValidada }
            />
          </FormCampo>

          <FormCampo label="Juro" colunas={ 2 } htmlFor="juro" erro={ errosCampo.juro }>
            <input
              id="juro"
              type="number"
              step="0.01"
              min="0"
              value={ form.juro }
              onChange={ ( evento ) => setForm ( { ...form, juro: evento.target.value } ) }
              placeholder="0.00"
              disabled={ !editando && !chaveValidada }
            />
          </FormCampo>

          <FormCampo label="Desconto" colunas={ 2 } htmlFor="desconto" erro={ errosCampo.desconto }>
            <input
              id="desconto"
              type="number"
              step="0.01"
              min="0"
              value={ form.desconto }
              onChange={ ( evento ) => setForm ( { ...form, desconto: evento.target.value } ) }
              placeholder="0.00"
              disabled={ !editando && !chaveValidada }
            />
          </FormCampo>

          <FormCampo label="Multa" colunas={ 2 } htmlFor="multa" erro={ errosCampo.multa }>
            <input
              id="multa"
              type="number"
              step="0.01"
              min="0"
              value={ form.multa }
              onChange={ ( evento ) => setForm ( { ...form, multa: evento.target.value } ) }
              placeholder="0.00"
              disabled={ !editando && !chaveValidada }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Status" colunas={ 3 }>
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
          <Botao type="submit" disabled={ salvando || ( !editando && !chaveValidada ) }>
            { salvando ? 'Salvando…' : 'Salvar' }
          </Botao>
        </FormAcoes>
      </FormModal>
      {
        consultandoForn && (
          <FornecedorConsulta
            onSelecionar={ HandleSelecionarFornecedor }
            onCancelar={ () => setConsultandoForn ( false ) }
          />
        )
      }
      {
        consultandoFormaPag && (
          <FormaPagamentoConsulta
            onSelecionar={ HandleSelecionarFormaPag }
            onCancelar={ () => setConsultandoFormaPag ( false ) }
          />
        )
      }
    </>
  );
}
