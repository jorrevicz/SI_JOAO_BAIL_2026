import { useState } from 'react';
import { ApiError } from '../../services/api';
import
{
  contasPagamentoService,
  type ContaAPagar,
  type CreateContaAPagarInput,
} from '../../services/contasPagamento';
import { fornecedoresService } from '../../services/fornecedores';
import { formasPagamentoService } from '../../services/formasPagamento';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { FornecedorConsulta } from '../fornecedores/FornecedorConsulta';
import { FormaPagamentoConsulta } from '../formasPagamento/FormaPagamentoConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { paraDataHoraInputUtc, fimDoDiaUtc, doInputUtcParaIso } from '../../utils/formatters';

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
    // Ao criar (sem inicial.dtEmissao), a emissão nasce com a data/hora atual (UTC) e o
    // vencimento com o fim do dia de hoje (UTC) — RN005: vencimento estritamente
    // posterior à emissão, mesmo no mesmo dia (ver contasPagamento.schema.ts).
    dtEmissao:     inicial.dtEmissao     ? inicial.dtEmissao.slice ( 0, 16 )    : paraDataHoraInputUtc ( new Date() ),
    dtVencimento:  inicial.dtVencimento  ? inicial.dtVencimento.slice ( 0, 16 ) : paraDataHoraInputUtc ( fimDoDiaUtc ( new Date() ) ),
    valor:         inicial.valor         ?? '',
    juro:          inicial.juro          ?? '0.00',
    desconto:      inicial.desconto      ?? '0.00',
    multa:         inicial.multa         ?? '0.00',
    isActive:      inicial.isActive      ?? true,
  } );

  const campoFornecedor = useCampoConsulta (
    {
      codigoInicial: inicial.codFornecedor,
      buscar:        fornecedoresService.obter,
      codigoDe:      ( entidade ) => entidade.codForn,
      descricaoDe:   ( entidade ) => entidade.fornecedor,
    }
  );

  const campoFormaPag = useCampoConsulta (
    {
      codigoInicial: inicial.codFormaDePag,
      buscar:        formasPagamentoService.obter,
      codigoDe:      ( entidade ) => entidade.codFormaDePag,
      descricaoDe:   ( entidade ) => entidade.formaDePag,
    }
  );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!( inicial.numero && inicial.modelo && inicial.serie && inicial.parcela );

  // Conta já baixada ou cancelada não pode mais ter seus valores alterados.
  const contaBaixada    = !!inicial.dtBaixa;
  const contaCancelada  = !!inicial.justificativaCancelamento;
  const edicaoBloqueada = editando && ( contaBaixada || contaCancelada );

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

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    const validacoes = await Promise.all ( [ campoFornecedor.validar(), campoFormaPag.validar() ] );

    if ( validacoes.includes ( false ) )
    {
      setSalvando ( false );
      return;
    }

    const dados: CreateContaAPagarInput =
    {
      numero:        form.numero,
      modelo:        form.modelo,
      serie:         form.serie,
      parcela:       form.parcela,
      codFornecedor: campoFornecedor.codigo,
      codFormaDePag: campoFormaPag.codigo,
      dtEmissao:     doInputUtcParaIso ( form.dtEmissao ),
      dtVencimento:  doInputUtcParaIso ( form.dtVencimento ),
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
        erro={ erro || ( edicaoBloqueada
          ? contaCancelada
            ? 'Conta cancelada — não é possível alterar seus valores.'
            : 'Conta já baixada — não é possível alterar seus valores.'
          : '' ) }
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
          <CampoConsulta
            campo={ campoFornecedor }
            Consulta={ FornecedorConsulta }
            rotulo="Fornecedor"
            rotuloCodigo="Código do fornecedor"
            rotuloNome="Nome do fornecedor"
            obrigatorio
            erroApi={ errosCampo.codFornecedor }
            colunas={ [ 3, 2, 5 ] }
            desabilitado={ !editando && !chaveValidada || edicaoBloqueada }
          />
        </FormSecao>

        <FormSecao>
          <CampoConsulta
            campo={ campoFormaPag }
            Consulta={ FormaPagamentoConsulta }
            rotulo="Forma de pagamento"
            rotuloCodigo="Código da forma"
            rotuloNome="Descrição da forma"
            obrigatorio
            erroApi={ errosCampo.codFormaDePag }
            colunas={ [ 3, 2, 5 ] }
            desabilitado={ !editando && !chaveValidada || edicaoBloqueada }
          />
        </FormSecao>

        <FormSecao>
          <FormCampo label="Data e hora de emissão (UTC)" obrigatorio colunas={ 3 } htmlFor="dtEmissao" erro={ errosCampo.dtEmissao }>
            <input
              id="dtEmissao"
              type="datetime-local"
              value={ form.dtEmissao }
              onChange={ ( evento ) => setForm ( { ...form, dtEmissao: evento.target.value } ) }
              required
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>

          <FormCampo label="Data e hora de vencimento (UTC)" obrigatorio colunas={ 3 } htmlFor="dtVencimento" erro={ errosCampo.dtVencimento }>
            <input
              id="dtVencimento"
              type="datetime-local"
              value={ form.dtVencimento }
              onChange={ ( evento ) => setForm ( { ...form, dtVencimento: evento.target.value } ) }
              min={ form.dtEmissao || undefined }
              required
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
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
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
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
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
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
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
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
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Status" colunas={ 3 }>
            <CaixaSelecao
              value={ form.isActive }
              onChange={ ( evento ) => setForm ( { ...form, isActive: evento } ) }
              desabilitado={ edicaoBloqueada }
            />
          </FormCampo>
        </FormSecao>

        <FormAcoes>
          <Botao type="button" $variante="secundario" onClick={ onCancelar }>
            Cancelar
          </Botao>
          <Botao type="submit" disabled={ salvando || ( !editando && !chaveValidada ) || edicaoBloqueada }>
            { salvando ? 'Salvando…' : 'Salvar' }
          </Botao>
        </FormAcoes>
      </FormModal>
    </>
  );
}
