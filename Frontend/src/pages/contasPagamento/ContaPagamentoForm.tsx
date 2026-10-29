import { useEffect, useState } from 'react';
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
import { fimDoDiaUtc, doInputUtcParaIso } from '../../utils/formatters';
import { paraDataHoraInputUtc } from '../../utils/formatters';
import { comErroDoCampo, validarDecimal, validarDigitos } from '../../utils/validators';

// Novo: o botão "Lançar conta" cadastra a conta já baixada (sem edição, baixa posterior nem
// exclusão). consulta: só leitura. Não há cancelamento/exclusão por esta tela: a conta a
// pagar só é desativada pelo cancelamento da compra do mesmo documento (tela de Compras).
export type ModoConta = 'consulta';

const TITULOS: Record < ModoConta, string > =
{
  consulta: 'Consultar conta a pagar',
};

interface Props
{
  modo?:      ModoConta;
  inicial:    Partial < ContaAPagar >;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function ContaPagamentoForm ( { modo, inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateContaAPagarInput > ( {
    numero:        inicial.numero        ?? '',
    modelo:        inicial.modelo        ?? '',
    serie:         inicial.serie         ?? '',
    parcela:       inicial.parcela       ?? 0,
    codFornecedor: inicial.codFornecedor ?? 0,
    codFormaDePag: inicial.codFormaDePag ?? 0,
    // Ao criar, o vencimento nasce com o fim do dia de hoje (UTC).
    dtVencimento:  inicial.dtVencimento  ? inicial.dtVencimento.slice ( 0, 16 ) : paraDataHoraInputUtc ( fimDoDiaUtc ( new Date() ) ),
    valor:         inicial.valor         ?? '',
    juro:          inicial.juro          ?? '0.00',
    desconto:      inicial.desconto      ?? '0.00',
    multa:         inicial.multa         ?? '0.00',
    // A conta nasce baixada: valor em branco = valor total calculado pelo Backend.
    valorBaixa:    inicial.valorBaixa    ?? '',
    dtBaixa:       inicial.dtBaixa       ? inicial.dtBaixa.slice ( 0, 16 ) : paraDataHoraInputUtc ( new Date() ),
    isActive:      inicial.isActive ?? true,
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

  // Valor total (valor + juro + multa − desconto): calculado pelo Backend a cada mudança.
  const [ vlrTotal, setVlrTotal ] = useState ( inicial.vlrTotal ?? '0.00' );

  useEffect ( () =>
  {
    let ativo = true;

    const temporizador = setTimeout ( () =>
    {
      const paraDecimal = ( valor: string ) => Number ( valor || 0 ).toFixed ( 2 );

      contasPagamentoService
        .calcularTotal ( {
          valor:    paraDecimal ( form.valor ),
          juro:     paraDecimal ( form.juro ),
          multa:    paraDecimal ( form.multa ),
          desconto: paraDecimal ( form.desconto ),
        } )
        .then ( ( resultado ) =>
        {
          if ( ativo )
          {
            setVlrTotal ( resultado.vlrTotal );
          }
        } )
        .catch ( () => undefined );
    }, 300 );

    return () =>
    {
      ativo = false;
      clearTimeout ( temporizador );
    };
  }, [ form.valor, form.juro, form.multa, form.desconto ] );

  const editando = !!( inicial.numero && inicial.modelo && inicial.serie && inicial.codFornecedor && inicial.parcela );

  // Sem edição: fora do modo novo (consulta) tudo fica somente leitura. Uma conta cancelada
  // (pela compra) mostra a justificativa só para leitura.
  const contaCancelada  = !!inicial.justificativaCancelamento;
  const somenteLeitura  = modo !== undefined;
  const edicaoBloqueada = somenteLeitura;

  // A chave (numero/modelo/serie/fornecedor/parcela) precisa ser validada — formato e
  // inexistência prévia — antes de liberar a edição dos demais campos (ver docs/02-arquitetura.md).
  const [ chaveValidada, setChaveValidada ] = useState ( editando );
  const [ validandoChave, setValidandoChave ] = useState ( false );
  const [ erroChave, setErroChave ]           = useState ( '' );

  const AlterarChave = ( campo: 'numero' | 'modelo' | 'serie', valor: string ) =>
  {
    setForm ( { ...form, [ campo ]: valor } );
  };

  // A validação dispara sozinha quando todos os campos da chave estão preenchidos.
  const chaveCompleta = form.numero.length === 9 && form.modelo.length === 2 && form.serie.length === 2
    && campoFornecedor.codigo > 0 && form.parcela >= 1;

  useEffect ( () =>
  {
    if ( editando )
    {
      return;
    }

    // Mudou a chave: a validação anterior deixa de valer.
    /* eslint-disable react-hooks/set-state-in-effect */
    setChaveValidada ( false );
    setErroChave ( '' );
    /* eslint-enable react-hooks/set-state-in-effect */

    if ( !chaveCompleta )
    {
      return;
    }

    let ativo = true;

    const temporizador = setTimeout ( async () =>
    {
      setValidandoChave ( true );
      setErrosCampo ( {} );

      try
      {
        // O fornecedor faz parte da chave: precisa existir antes de validar o documento.
        if ( !( await campoFornecedor.validar() ) )
        {
          return;
        }

        await contasPagamentoService.validarChave (
          {
          numero:  form.numero,
          modelo:  form.modelo,
          serie:   form.serie,
          codFornecedor: campoFornecedor.codigo,
          parcela: form.parcela,
        }
        );

        if ( ativo )
        {
          setChaveValidada ( true );
        }
      }
      catch ( err )
      {
        if ( ativo )
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
      }
      finally
      {
        if ( ativo )
        {
          setValidandoChave ( false );
        }
      }
    }, 400 );

    return () =>
    {
      ativo = false;
      clearTimeout ( temporizador );
      setValidandoChave ( false );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ form.numero, form.modelo, form.serie, form.parcela, campoFornecedor.codigo ] );

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();

    if ( modo === 'consulta' )
    {
      return;
    }

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
      dtVencimento:  doInputUtcParaIso ( form.dtVencimento ),
      valor:         Number ( form.valor ).toFixed ( 2 ),
      juro:          Number ( form.juro ).toFixed ( 2 ),
      desconto:      Number ( form.desconto ).toFixed ( 2 ),
      multa:         Number ( form.multa ).toFixed ( 2 ),
      valorBaixa:    Number ( form.valorBaixa || vlrTotal ).toFixed ( 2 ),
      dtBaixa:       doInputUtcParaIso ( form.dtBaixa ),
      isActive:      form.isActive,
    };

    try
    {
      await contasPagamentoService.criar ( dados );
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
        titulo={ modo ? TITULOS[ modo ] : 'Nova conta a pagar' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Modelo" obrigatorio colunas={ 1 } htmlFor="modelo" erro={ errosCampo.modelo }>
            <input
              id="modelo"
              value={ form.modelo }
              onChange={ ( evento ) =>
              {
                AlterarChave ( 'modelo', evento.target.value.replace ( /\D/g, '' ) );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'modelo', validarDigitos ( evento.target.value, [ 2 ], 'O modelo' ) ) );
              } }
              maxLength={ 2 }
              placeholder="2 dígitos"
              disabled={ editando }
              readOnly={ editando }
              required
            />
          </FormCampo>

          <FormCampo label="Série" obrigatorio colunas={ 1 } htmlFor="serie" erro={ errosCampo.serie }>
            <input
              id="serie"
              value={ form.serie }
              onChange={ ( evento ) =>
              {
                AlterarChave ( 'serie', evento.target.value.replace ( /\D/g, '' ) );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'serie', validarDigitos ( evento.target.value, [ 2 ], 'A série' ) ) );
              } }
              maxLength={ 2 }
              placeholder="2 dígitos"
              disabled={ editando }
              readOnly={ editando }
              required
            />
          </FormCampo>

          <FormCampo label="Número" obrigatorio colunas={ 2 } htmlFor="numero" erro={ errosCampo.numero }>
            <input
              id="numero"
              value={ form.numero }
              onChange={ ( evento ) =>
              {
                AlterarChave ( 'numero', evento.target.value.replace ( /\D/g, '' ) );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'numero', validarDigitos ( evento.target.value, [ 9 ], 'O número' ) ) );
              } }
              maxLength={ 9 }
              placeholder="9 dígitos"
              disabled={ editando }
              readOnly={ editando }
              required
              autoFocus
            />
          </FormCampo> 

          <FormCampo label="Parcela" obrigatorio colunas={ 1 } htmlFor="parcela" erro={ errosCampo.parcela }>
            <input
              id="parcela"
              type="number"
              min="1"
              value={ form.parcela }
              onChange={ ( evento ) => setForm ( { ...form, parcela: Number ( evento.target.value ) } ) }
              disabled={ editando }
              readOnly={ editando }
              required
            />
          </FormCampo> 
          <FormCampo colunas={ 0.5 }>
            <div></div>
          </FormCampo>
          <CampoConsulta
            campo={ campoFornecedor }
            Consulta={ FornecedorConsulta }
            rotulo="Fornecedor"
            rotuloCodigo="Código do fornecedor"
            rotuloNome="Nome do fornecedor"
            obrigatorio
            erroApi={ errosCampo.codFornecedor }
            colunas={ [ 2, 1, 3.5 ] }
            desabilitado={ editando }
          />
        </FormSecao> 

        <FormSecao>
          {
            !editando && (
              <FormCampo label="Chave do documento" colunas={ 12 } erro={ erroChave }>
                <span role="status">
                  { validandoChave ? 'Validando…' : chaveValidada ? 'Chave válida ✓' : 'Preencha a chave para validar' }
                </span>
              </FormCampo>
            )
          }
        </FormSecao>

        <FormSecao>
          <FormCampo label="Data e hora da baixa (UTC)" obrigatorio colunas={ 3 } htmlFor="dtBaixa" erro={ errosCampo.dtBaixa }>
            <input
              id="dtBaixa"
              type="datetime-local"
              value={ form.dtBaixa }
              onChange={ ( evento ) => setForm ( { ...form, dtBaixa: evento.target.value } ) }
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
              required
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>
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
            colunas={ [ 2, 1, 5 ] }
            desabilitado={ !editando && !chaveValidada || edicaoBloqueada }
          />
        </FormSecao>
 
        <FormSecao>
          <FormCampo label="Valor" obrigatorio colunas={ 2 } htmlFor="valor" erro={ errosCampo.valor }>
            <input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={ form.valor }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, valor: evento.target.value } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'valor', validarDecimal ( evento.target.value, 2, 'O valor' ) ) );
              } }
              placeholder="0.00"
              required
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Juro" colunas={ 2 } htmlFor="juro" erro={ errosCampo.juro }>
            <input
              id="juro"
              type="number"
              step="0.01"
              min="0"
              value={ form.juro }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, juro: evento.target.value } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'juro', validarDecimal ( evento.target.value, 2, 'O juro' ) ) );
              } }
              placeholder="0.00"
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Desconto" colunas={ 2 } htmlFor="desconto" erro={ errosCampo.desconto }>
            <input
              id="desconto"
              type="number"
              step="0.01"
              min="0"
              value={ form.desconto }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, desconto: evento.target.value } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'desconto', validarDecimal ( evento.target.value, 2, 'O desconto' ) ) );
              } }
              placeholder="0.00"
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Multa" colunas={ 2 } htmlFor="multa" erro={ errosCampo.multa }>
            <input
              id="multa"
              type="number"
              step="0.01"
              min="0"
              value={ form.multa }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, multa: evento.target.value } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'multa', validarDecimal ( evento.target.value, 2, 'A multa' ) ) );
              } }
              placeholder="0.00"
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Valor da baixa" colunas={ 2 } htmlFor="valorBaixa" erro={ errosCampo.valorBaixa }>
            <input
              id="valorBaixa"
              type="number"
              step="0.01"
              min="0"
              value={ form.valorBaixa }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, valorBaixa: evento.target.value } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'valorBaixa', validarDecimal ( evento.target.value, 2, 'O valor da baixa' ) ) );
              } }
              placeholder={ vlrTotal }
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
              readOnly
              style={ { fontWeight: 700 } }
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

        {
          contaCancelada && (
            <FormSecao>
              <FormCampo
                label="Justificativa do cancelamento (da compra)"
                colunas={ 12 }
                htmlFor="justificativaCancelamento"
              >
                <input
                  id="justificativaCancelamento"
                  value={ inicial.justificativaCancelamento ?? '' }
                  disabled
                  readOnly
                />
              </FormCampo>
            </FormSecao>
          )
        }

        <FormAcoes>
          <Botao type="button" $variante="secundario" onClick={ onCancelar }>
            { somenteLeitura ? 'Voltar' : 'Cancelar' }
          </Botao>
          {
            !somenteLeitura && (
              <Botao type="submit" disabled={ salvando || ( !editando && !chaveValidada ) || edicaoBloqueada }>
                { salvando ? 'Lançando…' : 'Lançar conta' }
              </Botao>
            )
          }
        </FormAcoes>
      </FormModal>
    </>
  );
}
