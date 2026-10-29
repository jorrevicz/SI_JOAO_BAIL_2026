import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { comprasService, type CompraDetalhe, type CompraId } from '../../services/compras';
import { transportadorasService } from '../../services/transportadoras';
import { veiculosService, type Veiculo } from '../../services/veiculos';
import
{
  notasFiscaisService,
  CSOSN_VALIDOS,
  FRETE_POR_CONTA,
  type NotaFiscalDetalhe,
  type NotaFiscalId,
  type CalculoNotaFiscal,
  type TributacaoItemInput,
} from '../../services/notasFiscais';
import { ConfirmarSenhaModal } from '../../components/confirmarSenha';
import { doInputUtcParaIso, formatarDataHora } from '../../utils/formatters';
import
{
  FormModal, FormSecao, FormCampo, FormAcoes, Botao,
  TabelaWrapper, Tabela, ErroCampo, Alerta,
  InfoBlock,
} from './style';

// gerar: NF-e de entrada a partir de uma compra lançada (RN002); consulta: só leitura
// (RN003 — compra com nota gerada só a consulta); cancelar: consulta + justificativa e popup
// de reautenticação (RN003 transversal).
export type ModoNotaFiscal = 'gerar' | 'consulta' | 'cancelar';

interface Props
{
  modo:        ModoNotaFiscal;
  // Compra de origem — obrigatória para gerar.
  compra?:     CompraDetalhe | null;
  // Nota já gerada — obrigatória para consultar/cancelar.
  nota?:       NotaFiscalDetalhe | null;
  onConcluido: () => void;
  onFechar:    () => void;
}

const TITULOS: Record < ModoNotaFiscal, string > = {
  gerar:    'Gerar nota fiscal',
  consulta: 'Consultar nota fiscal',
  cancelar: 'Cancelar nota fiscal',
};

// Tributação editável de um item (texto dos inputs; o Backend valida e calcula).
interface TributacaoLocal
{
  cfop:     string;
  csosn:    string;
  aliqIcms: string;
  aliqIpi:  string;
}

// Sugestão inicial: compra para comercialização dentro do estado, Simples Nacional sem crédito.
const TRIBUTACAO_PADRAO: TributacaoLocal = { cfop: '1102', csosn: '102', aliqIcms: '0', aliqIpi: '0' };

// Texto do input numérico → decimal com 2 casas exigido pela API (só formatação).
const paraDecimal = ( valor: string ) => Number ( valor || 0 ).toFixed ( 2 );

export default function NotaFiscalForm ( { modo, compra = null, nota = null, onConcluido, onFechar }: Props )
{
  const gerando = modo === 'gerar';

  // A nota tem as mesmas chaves da compra (o fornecedor é `codFornecedor` na API da nota).
  const chaveCompra: CompraId = gerando
    ? { numero: compra?.numero ?? '', modelo: compra?.modelo ?? '', serie: compra?.serie ?? '', codForn: compra?.codForn ?? 0 }
    : { numero: nota?.numero ?? '', modelo: nota?.modelo ?? '', serie: nota?.serie ?? '', codForn: nota?.codFornecedor ?? 0 };

  const idNota: NotaFiscalId = { numero: chaveCompra.numero, modelo: chaveCompra.modelo, serie: chaveCompra.serie, codFornecedor: chaveCompra.codForn };

  // Origem: a compra completa (cabeçalho, itens, despesas e parcelas), somente leitura. Na
  // geração ela vem da listagem de Compras; na consulta/cancelamento é buscada pela chave da nota.
  const [ origem, setOrigem ]               = useState < CompraDetalhe | null > ( compra );
  const [ veiculo, setVeiculo ]             = useState < Veiculo | null > ( null );

  const [ chaveAcessoNfe, setChaveAcessoNfe ] = useState ( nota?.chaveAcessoNfe ?? '' );
  // A emissão da nota nasce igual à da compra (o documento é o mesmo).
  const [ dhEmiNfe, setDhEmiNfe ]             = useState ( ( nota?.dhEmiNfe ?? compra?.dtEmissao ?? '' ).slice ( 0, 16 ) );
  const [ dhSaiNfe, setDhSaiNfe ]             = useState ( nota?.dhSaiNfe?.slice ( 0, 16 ) ?? '' );
  const [ fretePorConta, setFretePorConta ]   = useState ( nota?.fretePorConta ?? FRETE_POR_CONTA[ 0 ] );
  const [ infoCompl, setInfoCompl ]           = useState ( nota?.infoCompl ?? '' );

  const [ tributacao, setTributacao ] = useState < Record < number, TributacaoLocal > > (
    Object.fromEntries ( ( compra?.itens ?? [] ).map ( ( item ) => [ item.codProduto, { ...TRIBUTACAO_PADRAO } ] ) )
  );

  const [ calculo, setCalculo ]           = useState < CalculoNotaFiscal | null > ( nota );
  const [ errosCalculo, setErrosCalculo ] = useState < Record < string, string > > ( {} );
  const [ justificativa, setJustificativa ]       = useState ( nota?.justificativaCancelamento ?? '' );
  const [ confirmandoSenha, setConfirmandoSenha ] = useState ( false );
  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ enviando, setEnviando ]     = useState ( false );

  const erros = { ...errosCalculo, ...errosCampo };

  const tributacaoEntrada = (): TributacaoItemInput[] =>
    ( compra?.itens ?? [] ).map ( ( item ) => (
      {
        codProduto: item.codProduto,
        cfop:       tributacao[ item.codProduto ].cfop,
        csosn:      tributacao[ item.codProduto ].csosn,
        aliqIcms:   paraDecimal ( tributacao[ item.codProduto ].aliqIcms ),
        aliqIpi:    paraDecimal ( tributacao[ item.codProduto ].aliqIpi ),
      }
    ) );

  // Consulta/cancelamento: a nota não traz parcelas nem os códigos dos parceiros — a compra
  // de origem é buscada pelas mesmas chaves.
  useEffect ( () =>
  {
    let ativo = true;

    if ( origem || !chaveCompra.codForn )
    {
      return;
    }

    comprasService
      .obter ( chaveCompra )
      .then ( ( compraOrigem ) =>
      {
        if ( ativo )
        {
          setOrigem ( compraOrigem );
        }
      } )
      .catch ( ( err ) =>
      {
        if ( ativo )
        {
          setErro ( ( err as Error ).message );
        }
      } );

    return () =>
    {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [] );

  // Veículo da transportadora da compra (o cadastro da transportadora guarda só `codVeiculo`).
  useEffect ( () =>
  {
    let ativo = true;

    if ( !origem || origem.codTransp === null )
    {
      return;
    }

    transportadorasService
      .obter ( origem.codTransp )
      .then ( ( transportadora ) =>
        transportadora.codVeiculo !== null ? veiculosService.obter ( transportadora.codVeiculo ) : null
      )
      .then ( ( oVeiculo ) =>
      {
        if ( ativo )
        {
          setVeiculo ( oVeiculo );
        }
      } )
      .catch ( ( err ) =>
      {
        if ( ativo )
        {
          setErro ( ( err as Error ).message );
        }
      } );

    return () =>
    {
      ativo = false;
    };
  }, [ origem ] );

  useEffect ( () =>
  {
    let ativo = true;

    if ( !gerando )
    {
      return;
    }

    // Prévia dos impostos: base, ICMS, IPI e totais são calculados pelo Backend a cada
    // mudança da tributação — o Frontend só exibe o resultado.
    const temporizador = setTimeout ( () =>
    {
      notasFiscaisService
        .calcular ( { ...idNota, itens: tributacaoEntrada() } )
        .then ( ( resultado ) =>
        {
          if ( ativo )
          {
            setCalculo ( resultado );
            setErrosCalculo ( {} );
          }
        } )
        .catch ( ( err ) =>
        {
          if ( ativo )
          {
            setCalculo ( null );
            setErrosCalculo ( err instanceof ApiError && err.erros ? err.erros : { itens: ( err as Error ).message } );
          }
        } );
    }, 300 );

    return () =>
    {
      ativo = false;
      clearTimeout ( temporizador );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ tributacao ] );

  const AlterarTributacao = ( codProduto: number, campo: keyof TributacaoLocal, valor: string ) =>
  {
    setTributacao ( { ...tributacao, [ codProduto ]: { ...tributacao[ codProduto ], [ campo ]: valor } } );
  };

  const Executar = async ( acao: () => Promise < void > ) =>
  {
    setEnviando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      await acao();
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
      setEnviando ( false );
    }
  };

  const Gerar = async () =>
  {
    if ( !window.confirm ( 'Gerar a nota fiscal desta compra? Depois de gerada ela só poderá ser consultada ou cancelada.' ) )
    {
      return;
    }

    await notasFiscaisService.gerar ( {
      ...idNota,
      chaveAcessoNfe,
      dhEmiNfe:      doInputUtcParaIso ( dhEmiNfe ),
      dhSaiNfe:      dhSaiNfe ? doInputUtcParaIso ( dhSaiNfe ) : null,
      fretePorConta,
      infoCompl:     infoCompl.trim() || null,
      itens:         tributacaoEntrada(),
    } );

    onConcluido();
  };

  const submit = ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();

    if ( modo === 'cancelar' )
    {
      setConfirmandoSenha ( true );
      return;
    }

    if ( gerando )
    {
      void Executar ( Gerar );
    }
  };

  const ConfirmarCancelamento = () =>
  {
    setConfirmandoSenha ( false );

    void Executar ( async () =>
    {
      await notasFiscaisService.cancelar ( idNota, { justificativaCancelamento: justificativa } );
      onConcluido();
    } );
  };

  // Linhas da tabela de itens: na geração, os produtos da compra com a prévia calculada;
  // na consulta, os itens gravados (já calculados pelo Backend).
  const linhas = gerando
    ? ( compra?.itens ?? [] ).map ( ( item ) => (
      {
        ...item,
        ...calculo?.itens.find ( ( calculado ) => calculado.codProduto === item.codProduto ),
      }
    ) )
    : ( nota?.itens ?? [] );

  const avisoSituacao = nota
    ? ( nota.isActive ? 'Nota fiscal gerada.' : 'Nota fiscal cancelada.' )
    : '';

  return (
    <>
      <FormModal titulo={ TITULOS[ modo ] } erro={ erro } onFechar={ onFechar } onSubmit={ submit }>
        { avisoSituacao && <Alerta role="status">{ avisoSituacao }</Alerta> }

        {/* Documento e emitente — vêm da compra de origem */}
        <FormSecao>
          <FormCampo label="Modelo" colunas={ 1 } erro={ erros.numero }>
            <input disabled readOnly value={ chaveCompra.modelo } />
          </FormCampo>
          <FormCampo label="Série" colunas={ 1 }>
            <input disabled readOnly value={ chaveCompra.serie } />
          </FormCampo>

          <FormCampo label="Número" colunas={ 2 }>
            <input disabled readOnly value={ chaveCompra.numero } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Emissão da nota (UTC)" obrigatorio colunas={ 2.3 } htmlFor="dhEmiNfe" erro={ erros.dhEmiNfe }>
            <input
              id="dhEmiNfe"
              type="datetime-local"
              value={ dhEmiNfe }
              onChange={ ( evento ) => setDhEmiNfe ( evento.target.value ) }
              disabled={ !gerando }
              required={ gerando }
            />
          </FormCampo>

          <FormCampo label="Chegada (UTC)" colunas={ 2.3 } htmlFor="dhSaiNfe" erro={ erros.dhSaiNfe }>
            <input
              id="dhSaiNfe"
              type="datetime-local"
              value={ dhSaiNfe }
              min={ dhEmiNfe }
              onChange={ ( evento ) => setDhSaiNfe ( evento.target.value ) }
              disabled={ !gerando }
            />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Frete por conta" obrigatorio colunas={ 2.3 } htmlFor="fretePorConta" erro={ erros.fretePorConta }>
            <select
              id="fretePorConta"
              value={ fretePorConta }
              onChange={ ( evento ) => setFretePorConta ( evento.target.value ) }
              disabled={ !gerando }
            >
              { FRETE_POR_CONTA.map ( ( opcao ) => <option key={ opcao } value={ opcao }>{ opcao }</option> ) }
            </select>
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo colunas={ 12 }>
            <h4>Remetente</h4>
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Cód. Fornecedor" colunas={ 1.5 }>
            <input disabled readOnly value={ chaveCompra.codForn } />
          </FormCampo>
          <FormCampo label="Emitente" colunas={ 6 }>
            <input disabled readOnly value={ origem?.fornecedor ?? nota?.fornecedor ?? '' } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Chegada da compra" colunas={ 2 }>
            <input disabled readOnly value={ origem?.dtChegada ? formatarDataHora ( origem.dtChegada ) : '' } />
          </FormCampo>
          <FormCampo label="Emissão da compra" colunas={ 2 }>
            <input disabled readOnly value={ origem?.dtEmissao ? formatarDataHora ( origem.dtEmissao ) : '' } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
         <FormCampo colunas={ 12 }>
          <h4>Transportadora</h4>
         </FormCampo>
        </FormSecao>

        {
          origem && origem.codTransp === null
            ? (
              <FormSecao>
                <FormCampo label="Transportadora" colunas={ 4 }>
                  <input disabled readOnly value="— (compra sem transportadora)" />
                </FormCampo>
              </FormSecao>
            )
            : (
              <>
                <FormSecao>
                  <FormCampo label="Cód. Transportadora" colunas={ 1.5 }>
                    <input disabled readOnly value={ origem?.codTransp ?? '' } />
                  </FormCampo>
                  <FormCampo label="Razão social" colunas={ 5 }>
                    <input disabled readOnly value={ origem?.transportadora ?? '' } />
                  </FormCampo>
                    <FormCampo label="Placa do veículo" colunas={ 1.5 }>
                      <input disabled readOnly value={ veiculo?.placaVeiculo ?? '' } />
                  </FormCampo>
                </FormSecao>
              </>
            )
        }

        {/* Itens — quantidade, valor e desconto da compra; tributação informada por item */}
        <FormSecao>
          <FormCampo colunas={ 12 }>
            <h4>Dados do Produto</h4>
          </FormCampo>
        </FormSecao>

        <TabelaWrapper>
          <Tabela>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Und.</th>
                <th>Qtd.</th>
                <th>Valor unit. (R$)</th>
                <th>Desconto (R$)</th>
                <th>Valor (R$)</th>
                <th>CFOP</th>
                <th>CSOSN</th>
                <th>Alíq. ICMS (%)</th>
                <th>Base ICMS (R$)</th>
                <th>ICMS (R$)</th>
                <th>Alíq. IPI (%)</th>
                <th>IPI (R$)</th>
              </tr>
            </thead>
            <tbody>
              {
                linhas.map ( ( item ) =>
                {
                  const local = tributacao[ item.codProduto ];

                  return (
                    <tr key={ item.codProduto }>
                      <td><InfoBlock>{ item.produto }</InfoBlock></td>
                      <td>{ item.undProduto }</td>
                      <td style={ { textAlign: 'right' } }>{ item.quantidade }</td>
                      <td style={ { textAlign: 'right' } }>{ item.valorUnitario }</td>
                      <td style={ { textAlign: 'right' } }>{ item.desconto }</td>
                      <td style={ { textAlign: 'right' } }>{ 'valorProduto' in item ? item.valorProduto : '—' }</td>
                      <td>
                        {
                          gerando
                            ? (
                              <input
                                aria-label={ `CFOP de ${ item.produto }` }
                                value={ local.cfop }
                                onChange={ ( evento ) => AlterarTributacao ( item.codProduto, 'cfop', evento.target.value.replace ( /\D/g, '' ) ) }
                                maxLength={ 4 }
                                inputMode="numeric"
                                required
                                style={ { width: '4.5rem' } }
                              />
                            )
                            : ( 'cfop' in item ? item.cfop : '' )
                        }
                      </td>
                      <td>
                        {
                          gerando
                            ? (
                              <select
                                aria-label={ `CSOSN de ${ item.produto }` }
                                value={ local.csosn }
                                onChange={ ( evento ) => AlterarTributacao ( item.codProduto, 'csosn', evento.target.value ) }
                              >
                                { CSOSN_VALIDOS.map ( ( codigo ) => <option key={ codigo } value={ codigo }>{ codigo }</option> ) }
                              </select>
                            )
                            : ( 'csosn' in item ? item.csosn : '' )
                        }
                      </td>
                      <td>
                        {
                          gerando
                            ? (
                              <input
                                aria-label={ `Alíquota de ICMS de ${ item.produto }` }
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={ local.aliqIcms }
                                onChange={ ( evento ) => AlterarTributacao ( item.codProduto, 'aliqIcms', evento.target.value ) }
                                style={ { width: '5.5rem' } }
                              />
                            )
                            : ( 'aliqIcms' in item ? item.aliqIcms : '' )
                        }
                      </td>
                      <td style={ { textAlign: 'right' } }>{ 'baseIcms' in item ? item.baseIcms : '—' }</td>
                      <td style={ { textAlign: 'right' } }>{ 'valorIcms' in item ? item.valorIcms : '—' }</td>
                      <td>
                        {
                          gerando
                            ? (
                              <input
                                aria-label={ `Alíquota de IPI de ${ item.produto }` }
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={ local.aliqIpi }
                                onChange={ ( evento ) => AlterarTributacao ( item.codProduto, 'aliqIpi', evento.target.value ) }
                                style={ { width: '5.5rem' } }
                              />
                            )
                            : ( 'aliqIpi' in item ? item.aliqIpi : '' )
                        }
                      </td>
                      <td style={ { textAlign: 'right' } }>{ 'valorIpi' in item ? item.valorIpi : '—' }</td>
                    </tr>
                  );
                } )
              }
            </tbody>
          </Tabela>
        </TabelaWrapper>
        { erros.itens && <ErroCampo>{ erros.itens }</ErroCampo> }

        {/* Totais — calculados pelo Backend; frete, seguro e despesas vêm da compra */}
        <FormSecao>
          <FormCampo colunas={ 12 }>
            <h4>Cálculo Imposto</h4>
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Base do ICMS (R$)" colunas={ 3 }>
            <input disabled readOnly value={ calculo?.totalBaseIcms ?? '—' } />
          </FormCampo>
          <FormCampo label="ICMS (R$)" colunas={ 3 }>
            <input disabled readOnly value={ calculo?.totalIcms ?? '—' } />
          </FormCampo>
          <FormCampo label="IPI (R$)" colunas={ 3 }>
            <input disabled readOnly value={ calculo?.totalIpi ?? '—' } />
          </FormCampo>
          <FormCampo label="Total dos produtos (R$)" colunas={ 3 }>
            <input disabled readOnly value={ calculo?.totalProdutos ?? '—' } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Frete (R$)" colunas={ 3 }>
            <input disabled readOnly value={ origem?.frete ?? nota?.frete ?? '' } />
          </FormCampo>
          <FormCampo label="Seguro (R$)" colunas={ 3 }>
            <input disabled readOnly value={ origem?.seguro ?? nota?.seguro ?? '' } />
          </FormCampo>
          <FormCampo label="Outras despesas (R$)" colunas={ 3 }>
            <input disabled readOnly value={ origem?.despesas ?? nota?.despesas ?? '' } />
          </FormCampo>
          <FormCampo label="Total da nota (R$)" colunas={ 3 }>
            <input disabled readOnly value={ calculo?.vlrTotalNota ?? '—' } style={ { fontWeight: 600 } } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo colunas={ 12 }>
            <h4>Fatura</h4>
          </FormCampo>
        </FormSecao>

        {/* Fatura — parcelas da compra de origem (RN023), somente leitura */}
        <FormSecao>
          <FormCampo label="Condição de pagamento" colunas={ 7 }>
            <input disabled readOnly value={ origem?.condicaoPagamento ?? '' } />
          </FormCampo>
        </FormSecao>

        <TabelaWrapper>
          <Tabela>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Vencimento</th>
                <th>Forma de pagamento</th>
                <th>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {
                ( origem?.parcelas ?? [] ).length === 0
                  ? (
                    <tr>
                      <td colSpan={ 4 }>{ origem ? 'Compra sem parcelas.' : 'Carregando parcelas…' }</td>
                    </tr>
                  )
                  : ( origem?.parcelas ?? [] ).map ( ( parcela ) => (
                    <tr key={ parcela.numParcela }>
                      <td>{ parcela.numParcela }</td>
                      <td>{ formatarDataHora ( parcela.dtVencimento ) }</td>
                      <td>{ parcela.formaDePag }</td>
                      <td style={ { textAlign: 'right' } }>{ parcela.valor }</td>
                    </tr>
                  ) )
              }
            </tbody>
          </Tabela>
        </TabelaWrapper>

        <FormSecao>
          <FormCampo colunas={ 12 }>
            <h4>Informações Complementares</h4>
          </FormCampo>
        </FormSecao>

          <FormCampo label="Chave de acesso" obrigatorio colunas={ 5 } htmlFor="chaveAcessoNfe" erro={ erros.chaveAcessoNfe }>
            <input
              id="chaveAcessoNfe"
              value={ chaveAcessoNfe }
              onChange={ ( evento ) => setChaveAcessoNfe ( evento.target.value.replace ( /\D/g, '' ) ) }
              maxLength={ 44 }
              inputMode="numeric"
              placeholder="44 dígitos"
              disabled={ !gerando }
              required={ gerando }
              autoFocus={ gerando }
            />
          </FormCampo> 


        <FormSecao>
          <FormCampo label="Bloco de Notas" colunas={ 12 } htmlFor="infoCompl" erro={ erros.infoCompl }>
            <textarea
              id="infoCompl"
              value={ infoCompl }
              onChange={ ( evento ) => setInfoCompl ( evento.target.value ) }
              maxLength={ 2000 }
              rows={ 2 }
              disabled={ !gerando }
            />
          </FormCampo>
        </FormSecao>

        {
          ( modo === 'cancelar' || nota?.justificativaCancelamento ) && (
            <FormSecao>
              <FormCampo
                label="Justificativa do cancelamento"
                obrigatorio={ modo === 'cancelar' }
                colunas={ 12 }
                htmlFor="justificativaCancelamento"
                erro={ erros.justificativaCancelamento }
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
          <Botao type="button" $variante="secundario" onClick={ onFechar }>
            { gerando ? 'Cancelar' : 'Voltar' }
          </Botao>
          {
            gerando && (
              <Botao type="submit" disabled={ enviando || !calculo || chaveAcessoNfe.length !== 44 }>
                { enviando ? 'Gerando…' : 'Gerar nota fiscal' }
              </Botao>
            )
          }
          {
            modo === 'cancelar' && (
              <Botao type="submit" $variante="perigo" disabled={ enviando }>
                { enviando ? 'Cancelando…' : 'Confirmar cancelamento' }
              </Botao>
            )
          }
        </FormAcoes>
      </FormModal>

      {
        confirmandoSenha && (
          <ConfirmarSenhaModal
            titulo="Confirme sua identidade para cancelar a nota fiscal"
            onConfirmar={ ConfirmarCancelamento }
            onCancelar={ () => setConfirmandoSenha ( false ) }
          />
        )
      }
    </>
  );
}
