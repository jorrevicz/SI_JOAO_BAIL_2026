import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import
{
  contasReceberService,
  type ContaAReceber,
  type CreateContaAReceberInput,
} from '../../services/contasReceber';
import { clientesService } from '../../services/clientes';
import { formasPagamentoService } from '../../services/formasPagamento';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { ClienteConsulta } from '../clientes/ClienteConsulta';
import { FormaPagamentoConsulta } from '../formasPagamento/FormaPagamentoConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { ConfirmarSenhaModal } from '../../components/confirmarSenha';
import { paraDataHoraInputUtc, inicioDoDiaUtc, fimDoDiaUtc, doInputUtcParaIso } from '../../utils/formatters';

// Novo: o botão "Lançar conta" cadastra a conta já baixada (sem edição, baixa posterior nem
// exclusão). consulta: só leitura. cancelar: o formulário abre em modo de consulta e o botão
// de lançar dá lugar à confirmação (exige justificativa + confirmação de senha).
export type ModoConta = 'consulta' | 'cancelar';

const TITULOS: Record < ModoConta, string > =
{
  consulta: 'Consultar conta a receber',
  cancelar: 'Cancelar conta a receber',
};

interface Props
{
  modo?:      ModoConta;
  inicial:    Partial < ContaAReceber >;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function ContaReceberForm ( { modo, inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateContaAReceberInput > ( {
    numero:        inicial.numero        ?? '',
    modelo:        inicial.modelo        ?? '',
    serie:         inicial.serie         ?? '',
    parcela:       inicial.parcela       ?? 1,
    codCliente:    inicial.codCliente    ?? 0,
    codFormaDePag: inicial.codFormaDePag ?? 0,
    // Ao criar (sem inicial.dtEmissao), a emissão nasce com a data/hora atual (UTC) e o
    // vencimento com o fim do dia de hoje (UTC) — RN005: vencimento estritamente
    // posterior à emissão, mesmo no mesmo dia (ver contasReceber.schema.ts).
    dtEmissao:     inicial.dtEmissao     ? inicial.dtEmissao.slice ( 0, 16 )    : paraDataHoraInputUtc ( inicioDoDiaUtc ( new Date() ) ),
    dtVencimento:  inicial.dtVencimento  ? inicial.dtVencimento.slice ( 0, 16 ) : paraDataHoraInputUtc ( fimDoDiaUtc ( new Date() ) ),
    valor:         inicial.valor         ?? '',
    juro:          inicial.juro          ?? '0.00',
    desconto:      inicial.desconto      ?? '0.00',
    multa:         inicial.multa         ?? '0.00',
    // A conta nasce baixada: valor em branco = valor total calculado pelo Backend.
    valorBaixa:    inicial.valorBaixa    ?? '',
    dtBaixa:       inicial.dtBaixa       ? inicial.dtBaixa.slice ( 0, 16 ) : paraDataHoraInputUtc ( new Date() ),
    dtPagamento:   inicial.dtPagamento   ? inicial.dtPagamento.slice ( 0, 16 ) : paraDataHoraInputUtc ( new Date() ),
    isActive:      inicial.isActive      ?? true,
  } );

  const campoCliente = useCampoConsulta (
    {
      codigoInicial: inicial.codCliente,
      buscar:        clientesService.obter,
      codigoDe:      ( entidade ) => entidade.codCliente,
      descricaoDe:   ( entidade ) => entidade.cliente,
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
  const [ justificativa, setJustificativa ] = useState ( inicial.justificativaCancelamento ?? '' );
  const [ confirmandoSenha, setConfirmandoSenha ] = useState ( false );

  // Valor total (valor + juro + multa − desconto): calculado pelo Backend a cada mudança.
  const [ vlrTotal, setVlrTotal ] = useState ( inicial.vlrTotal ?? '0.00' );

  useEffect ( () =>
  {
    let ativo = true;

    const temporizador = setTimeout ( () =>
    {
      const paraDecimal = ( valor: string ) => Number ( valor || 0 ).toFixed ( 2 );

      contasReceberService
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

  const editando = !!( inicial.numero && inicial.modelo && inicial.serie && inicial.codCliente && inicial.parcela );

  // Sem edição: fora do modo novo (consulta/cancelar) tudo fica somente leitura.
  const contaCancelada  = !!inicial.justificativaCancelamento;
  const somenteLeitura  = modo !== undefined;
  const edicaoBloqueada = somenteLeitura;

  const idConta =
  {
    numero:  inicial.numero!,
    modelo:  inicial.modelo!,
    serie:   inicial.serie!,
    codCliente: inicial.codCliente!,
    parcela: inicial.parcela!,
  };

  const Executar = async ( acao: () => Promise < void > ) =>
  {
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      await acao();
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

  const ConfirmarCancelamento = () =>
  {
    setConfirmandoSenha ( false );

    void Executar ( () => contasReceberService.cancelar ( idConta, { justificativaCancelamento: justificativa } ).then ( () => undefined ) );
  };

  // A chave (numero/modelo/serie/cliente/parcela) precisa ser validada — formato e
  // inexistência prévia — antes de liberar a edição dos demais campos (ver docs/02-arquitetura.md).
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

    // O cliente faz parte da chave: precisa existir antes de validar o documento.
    if ( !( await campoCliente.validar() ) )
    {
      setValidandoChave ( false );
      return;
    }

    try
    {
      await contasReceberService.validarChave (
        {
          numero:  form.numero,
          modelo:  form.modelo,
          serie:   form.serie,
          codCliente: campoCliente.codigo,
          parcela: form.parcela,
        }
      );
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

    if ( modo === 'cancelar' )
    {
      // Justificativa informada, falta o popup de login/confirmação.
      setConfirmandoSenha ( true );
      return;
    }

    if ( modo === 'consulta' )
    {
      return;
    }

    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    const validacoes = await Promise.all ( [ campoCliente.validar(), campoFormaPag.validar() ] );

    if ( validacoes.includes ( false ) )
    {
      setSalvando ( false );
      return;
    }

    const dados: CreateContaAReceberInput =
    {
      numero:        form.numero,
      modelo:        form.modelo,
      serie:         form.serie,
      parcela:       form.parcela,
      codCliente:    campoCliente.codigo,
      codFormaDePag: campoFormaPag.codigo,
      dtEmissao:     doInputUtcParaIso ( form.dtEmissao ),
      dtVencimento:  doInputUtcParaIso ( form.dtVencimento ),
      valor:         Number ( form.valor ).toFixed ( 2 ),
      juro:          Number ( form.juro ).toFixed ( 2 ),
      desconto:      Number ( form.desconto ).toFixed ( 2 ),
      multa:         Number ( form.multa ).toFixed ( 2 ),
      valorBaixa:    Number ( form.valorBaixa || vlrTotal ).toFixed ( 2 ),
      dtBaixa:       doInputUtcParaIso ( form.dtBaixa ),
      dtPagamento:   doInputUtcParaIso ( form.dtPagamento ),
      isActive:      form.isActive,
    };

    try
    {
      await contasReceberService.criar ( dados );
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
        titulo={ modo ? TITULOS[ modo ] : 'Nova conta a receber' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Modelo" obrigatorio colunas={ 1 } htmlFor="modelo" erro={ errosCampo.modelo }>
            <input
              id="modelo"
              value={ form.modelo }
              onChange={ ( evento ) => AlterarChave ( 'modelo', evento.target.value.replace ( /\D/g, '' ) ) }
              maxLength={ 2 }
              placeholder="2 dígitos"
              disabled={ editando || chaveValidada }
              readOnly={ editando }
              required
            />
          </FormCampo>

          <FormCampo label="Número" obrigatorio colunas={ 2 } htmlFor="numero" erro={ errosCampo.numero }>
            <input
              id="numero"
              value={ form.numero }
              onChange={ ( evento ) => AlterarChave ( 'numero', evento.target.value.replace ( /\D/g, '' ) ) }
              maxLength={ 9 }
              placeholder="9 dígitos"
              disabled={ editando || chaveValidada }
              readOnly={ editando }
              required
              autoFocus
            />
          </FormCampo>
 
          <FormCampo label="Série" obrigatorio colunas={ 1 } htmlFor="serie" erro={ errosCampo.serie }>
            <input
              id="serie"
              value={ form.serie }
              onChange={ ( evento ) => AlterarChave ( 'serie', evento.target.value.replace ( /\D/g, '' ) ) }
              maxLength={ 2 }
              placeholder="2 dígitos"
              disabled={ editando || chaveValidada }
              readOnly={ editando }
              required
            />
          </FormCampo>

          <FormCampo label="Parcela" obrigatorio colunas={ 1 } htmlFor="parcela" erro={ errosCampo.parcela }>
            <input
              id="parcela"
              type="number"
              min="1"
              value={ form.parcela }
              onChange={ ( evento ) => setForm ( { ...form, parcela: Number ( evento.target.value ) } ) }
              disabled={ editando || chaveValidada }
              readOnly={ editando }
              required
            />
          </FormCampo> 
        </FormSecao> 

        <FormSecao>
          <CampoConsulta
            campo={ campoCliente }
            Consulta={ ClienteConsulta }
            rotulo="Cliente"
            rotuloCodigo="Código do cliente"
            rotuloNome="Nome do cliente"
            obrigatorio
            erroApi={ errosCampo.codCliente }
            colunas={ [ 2, 1, 5 ] }
            desabilitado={ editando || chaveValidada }
          />

          {
            !editando && (
              <FormCampo label="Chave do documento" colunas={ 2 } erro={ erroChave }>
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
              onChange={ ( evento ) => setForm ( { ...form, valor: evento.target.value } ) }
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
              onChange={ ( evento ) => setForm ( { ...form, juro: evento.target.value } ) }
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
              onChange={ ( evento ) => setForm ( { ...form, desconto: evento.target.value } ) }
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
              onChange={ ( evento ) => setForm ( { ...form, multa: evento.target.value } ) }
              placeholder="0.00"
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Valor total" colunas={ 2 } htmlFor="vlrTotal">
            <input id="vlrTotal" disabled readOnly value={ vlrTotal } style={ { fontWeight: 700 } } />
          </FormCampo>
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
          <FormCampo label="Valor da baixa" colunas={ 2 } htmlFor="valorBaixa" erro={ errosCampo.valorBaixa }>
            <input
              id="valorBaixa"
              type="number"
              step="0.01"
              min="0"
              value={ form.valorBaixa }
              onChange={ ( evento ) => setForm ( { ...form, valorBaixa: evento.target.value } ) }
              placeholder={ vlrTotal }
              disabled={ !editando && !chaveValidada || edicaoBloqueada }
            />
          </FormCampo>

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

          <FormCampo label="Data e hora do pagamento (UTC)" obrigatorio colunas={ 3 } htmlFor="dtPagamento" erro={ errosCampo.dtPagamento }>
            <input
              id="dtPagamento"
              type="datetime-local"
              value={ form.dtPagamento }
              onChange={ ( evento ) => setForm ( { ...form, dtPagamento: evento.target.value } ) }
              required
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

        {
          ( modo === 'cancelar' || contaCancelada ) && (
            <FormSecao>
              <FormCampo
                label="Justificativa do cancelamento"
                obrigatorio={ modo === 'cancelar' }
                colunas={ 12 }
                htmlFor="justificativaCancelamento"
                erro={ errosCampo.justificativaCancelamento }
              >
                <input
                  id="justificativaCancelamento"
                  value={ justificativa }
                  onChange={ ( evento ) => setJustificativa ( evento.target.value ) }
                  maxLength={ 255 }
                  disabled={ modo !== 'cancelar' }
                  required={ modo === 'cancelar' }
                  autoFocus={ modo === 'cancelar' }
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
          {
            modo === 'cancelar' && (
              <Botao type="submit" $variante="perigo" disabled={ salvando }>
                { salvando ? 'Cancelando…' : 'Confirmar cancelamento' }
              </Botao>
            )
          }
        </FormAcoes>
      </FormModal>

      {
        confirmandoSenha && (
          <ConfirmarSenhaModal
            titulo="Confirme sua identidade para cancelar a conta a receber"
            onConfirmar={ ConfirmarCancelamento }
            onCancelar={ () => setConfirmandoSenha ( false ) }
          />
        )
      }
    </>
  );
}
