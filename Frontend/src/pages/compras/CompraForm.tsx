import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../services/api';
import
{
  comprasService,
  type CompraDetalhe,
  type CompraId,
  type CalculoCompra,
  type ItemCompraInput,
  type ParcelaCompraInput,
  type CabecalhoCompraInput,
} from '../../services/compras';
import { fornecedoresService } from '../../services/fornecedores';
import { transportadorasService } from '../../services/transportadoras';
import { condicoesPagamentoService } from '../../services/condicoesPagamento';
import { CampoConsulta } from '../../components/campoConsulta';
import { ConfirmarSenhaModal } from '../../components/confirmarSenha';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { FornecedorConsulta } from '../fornecedores/FornecedorConsulta';
import { TransportadoraConsulta } from '../transportadoras/TransportadoraConsulta';
import { CondicaoPagamentoConsulta } from '../condicoesPagamento-Parcela/CondicaoPagamentoConsulta';
import { paraDataHoraInputUtc, inicioDoDiaUtc, doInputUtcParaIso, fimDoDiaUtc } from '../../utils/formatters';
import { CompraItemForm, type ItemLocal } from './CompraItemForm';
import { CompraParcelas } from './CompraParcelas';
import { somaParcelasEmCentavos, type ParcelaLocal } from './parcelas';
import
{
  FormModal, FormSecao, FormCampo, FormAcoes, Botao, GrupoBotoes,
  TabelaWrapper, Tabela, ErroCampo, Alerta, InfoBlock,
} from './style';

// novo: o botão "Lançar compra" faz o cadastro já lançado (a compra não tem rascunho nem
// edição — RN013). consulta: só leitura. cancelar (RN014): o formulário abre em modo de
// consulta e o botão de lançar dá lugar à confirmação do cancelamento.
export type ModoCompra = 'novo' | 'consulta' | 'cancelar';

interface Props
{
  compra:      CompraDetalhe | null;
  modo:        ModoCompra;
  onConcluido: () => void;
  onFechar:    () => void;
}

const TITULOS: Record < ModoCompra, string > = {
  novo:     'Nova compra',
  consulta: 'Consultar compra',
  cancelar: 'Cancelar compra',
};

// Texto do input numérico → decimal com 2 casas exigido pela API (só formatação).
const paraDecimal = ( valor: string ) => Number ( valor || 0 ).toFixed ( 2 );

const paraEntradaItem = ( item: ItemLocal ): ItemCompraInput => ( {
  codProduto:    item.codProduto,
  quantidade:    Number ( item.quantidade ),
  valorUnitario: paraDecimal ( item.valorUnitario ),
  desconto:      paraDecimal ( item.desconto ),
  unidade:       item.unidade,
} );

const paraEntradaParcela = ( parcela: ParcelaLocal ): ParcelaCompraInput => ( {
  numParcela:    parcela.numParcela,
  codFormaDePag: Number ( parcela.codFormaDePag ),
  valor:         paraDecimal ( parcela.valor ),
  dtVencimento:  doInputUtcParaIso ( parcela.dtVencimento ),
} );

export default function CompraForm ( { compra, modo, onConcluido, onFechar }: Props )
{
  const somenteLeitura = modo !== 'novo';

  // O fornecedor também é parte da chave (CompraId), mas vive no campo de consulta abaixo.
  const [ chave, setChave ] = useState < Omit < CompraId, 'codForn' > > ( {
    numero: compra?.numero ?? '',
    modelo: compra?.modelo ?? '',
    serie:  compra?.serie  ?? '',
  } );
  const [ chaveValidada, setChaveValidada ]   = useState ( modo !== 'novo' );
  const [ validandoChave, setValidandoChave ] = useState ( false );

  const campoFornecedor = useCampoConsulta (
    {
      codigoInicial: compra?.codForn,
      buscar:        fornecedoresService.obter,
      codigoDe:      ( fornecedor ) => fornecedor.codForn,
      descricaoDe:   ( fornecedor ) => fornecedor.fornecedor,
    }
  );
  const campoTransportadora = useCampoConsulta (
    {
      codigoInicial: compra?.codTransp,
      buscar:        transportadorasService.obter,
      codigoDe:      ( transportadora ) => transportadora.codTransp,
      descricaoDe:   ( transportadora ) => transportadora.transportadora,
    }
  );
  const idCompra: CompraId = { ...chave, codForn: campoFornecedor.codigo };

  const campoCondicao = useCampoConsulta (
    {
      codigoInicial: compra?.codCondDePag,
      buscar:        condicoesPagamentoService.obter,
      codigoDe:      ( condicao ) => condicao.codCondDePag,
      descricaoDe:   ( condicao ) => condicao.descricao ?? '',
    }
  );

  const [ dtEmissao, setDtEmissao ] = useState ( compra ? compra.dtEmissao.slice ( 0, 16 ) : paraDataHoraInputUtc ( inicioDoDiaUtc ( new Date() ) ) );
  const [ dtChegada, setDtChegada ] = useState ( compra ? compra.dtChegada.slice ( 0, 16 ) : paraDataHoraInputUtc ( fimDoDiaUtc ( new Date() ) ) );
  const [ frete, setFrete ]       = useState ( compra?.frete    ?? '' );
  const [ seguro, setSeguro ]     = useState ( compra?.seguro   ?? '' );
  const [ despesas, setDespesas ] = useState ( compra?.despesas ?? '' );
  const [ itens, setItens ]       = useState < ItemLocal[] > (
    ( compra?.itens ?? [] ).map ( ( item ) => ( {
      codProduto:    item.codProduto,
      produto:       item.produto,
      unidade:       item.unidade,
      quantidade:    String ( item.quantidade ),
      valorUnitario: item.valorUnitario,
      desconto:      item.desconto,
    } ) )
  );

  // RN022/RN023 — parcelas da compra (geradas pela condição e ajustáveis só aqui)
  const [ parcelas, setParcelas ] = useState < ParcelaLocal[] > (
    ( compra?.parcelas ?? [] ).map ( ( parcela ) => ( {
      numParcela:    parcela.numParcela,
      codFormaDePag: String ( parcela.codFormaDePag ),
      valor:         parcela.valor,
      dtVencimento:  paraDataHoraInputUtc ( new Date ( parcela.dtVencimento ) ),
    } ) )
  );
  const [ gerandoParcelas, setGerandoParcelas ] = useState ( false );

  const [ ultimoCalculo, setCalculo ]         = useState < CalculoCompra | null > ( null );
  const [ ultimosErrosCalculo, setErrosCalculo ] = useState < Record < string, string > > ( {} );
  const [ justificativa, setJustificativa ]   = useState ( compra?.justificativaCancelamento ?? '' );
  const [ confirmandoSenha, setConfirmandoSenha ] = useState ( false );
  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ lancando, setLancando ]     = useState ( false );

  // Sem itens não há o que calcular: a última prévia recebida deixa de valer.
  const calculo         = itens.length > 0 ? ultimoCalculo : null;
  const errosCalculo    = itens.length > 0 ? ultimosErrosCalculo : {};
  const camposLiberados = !somenteLeitura && chaveValidada;
  const erros           = { ...errosCalculo, ...errosCampo };

  // RN019 — com o primeiro produto o documento fiscal (chave, fornecedor, transportadora,
  // datas e despesas) fica bloqueado; só volta a ser editável sem nenhum produto.
  // RN021 — com parcelas geradas, o documento e os produtos ficam bloqueados; voltar a
  // editá-los exige descartar as parcelas.
  const documentoLiberado = camposLiberados && itens.length === 0;
  const produtosLiberados = camposLiberados && parcelas.length === 0;
  // Com as parcelas geradas, tudo acima das datas (documento, produtos e condição) fica
  // bloqueado e só Emissão/Chegada voltam a ser preenchíveis (sem produtos também valem).
  const datasLiberadas    = camposLiberados && ( itens.length === 0 || parcelas.length > 0 );
  const totalCompra       = calculo?.vlrTotal ?? null;
  const parcelasFecham    = totalCompra !== null && somaParcelasEmCentavos ( parcelas ) === Math.round ( Number ( totalCompra ) * 100 );

  // RN006 — ao escolher o fornecedor, a condição de pagamento cadastrada nele é
  // pré-preenchida; o usuário pode trocá-la só para esta compra. Na edição, o fornecedor
  // já gravado não sobrescreve a condição escolhida antes.
  const fornecedorAplicado = useRef < number | undefined > ( compra?.codForn );

  useEffect ( () =>
  {
    const fornecedor = campoFornecedor.entidade;

    if ( !fornecedor || somenteLeitura || fornecedor.codForn === fornecedorAplicado.current )
    {
      return;
    }

    fornecedorAplicado.current = fornecedor.codForn;
    condicoesPagamentoService.obter ( fornecedor.codCondDePag ).then ( campoCondicao.selecionar ).catch ( () => undefined );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ campoFornecedor.entidade ] );

  // Prévia dos totais: todo o cálculo (rateio, custos, totais, saldo) é feito pelo Backend
  // a cada mudança de item ou despesa — o Frontend só exibe o resultado.
  useEffect ( () =>
  {
    let ativo = true;

    if ( itens.length === 0 )
    {
      return;
    }

    const temporizador = setTimeout ( () =>
    {
      comprasService
        .calcular ( {
          frete:    paraDecimal ( frete ),
          seguro:   paraDecimal ( seguro ),
          despesas: paraDecimal ( despesas ),
          itens:    itens.map ( paraEntradaItem ),
        } )
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
  }, [ itens, frete, seguro, despesas ] );

  const AlterarChave = ( campo: keyof typeof chave, valor: string ) =>
  {
    setChave ( { ...chave, [ campo ]: valor.replace ( /\D/g, '' ) } );
    setChaveValidada ( false );
  };

  // RN007 — número/modelo/série/fornecedor validados (formato e inexistência) antes de
  // liberar o resto. O fornecedor faz parte da chave, então precisa existir antes.
  const ValidarChave = async () =>
  {
    setValidandoChave ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    if ( !( await campoFornecedor.validar() ) )
    {
      setValidandoChave ( false );
      return;
    }

    try
    {
      await comprasService.validarChave ( idCompra );
      setChaveValidada ( true );
    }
    catch ( err )
    {
      TratarErro ( err );
    }
    finally
    {
      setValidandoChave ( false );
    }
  };

  // RN022 — o Backend calcula as parcelas (valor e vencimento) a partir da condição escolhida;
  // o Frontend só as exibe. Regerar substitui as linhas, inclusive os ajustes manuais.
  const GerarParcelas = async () =>
  {
    if ( !( await campoCondicao.validar() ) )
    {
      return;
    }

    if ( parcelas.length > 0 && !window.confirm ( 'Gerar as parcelas de novo descarta os ajustes feitos nas parcelas atuais. Continuar?' ) )
    {
      return;
    }

    setGerandoParcelas ( true );
    setErro ( '' );

    try
    {
      const gerado = await comprasService.gerarParcelas ( {
        codCondDePag: campoCondicao.codigo,
        dtEmissao:    doInputUtcParaIso ( dtEmissao ),
        frete:        paraDecimal ( frete ),
        seguro:       paraDecimal ( seguro ),
        despesas:     paraDecimal ( despesas ),
        itens:        itens.map ( paraEntradaItem ),
      } );

      setParcelas ( gerado.parcelas.map ( ( parcela ) => ( {
        numParcela:    parcela.numParcela,
        codFormaDePag: String ( parcela.codFormaDePag ),
        valor:         parcela.valor,
        dtVencimento:  paraDataHoraInputUtc ( new Date ( parcela.dtVencimento ) ),
      } ) ) );
    }
    catch ( err )
    {
      TratarErro ( err );
    }
    finally
    {
      setGerandoParcelas ( false );
    }
  };

  // RN021 — sair do modo de parcelas para voltar ao documento/produtos.
  const DescartarParcelas = () =>
  {
    if ( window.confirm ( 'Descartar as parcelas geradas para voltar a editar o documento e os produtos?' ) )
    {
      setParcelas ( [] );
    }
  };

  const TratarErro = ( err: unknown ) =>
  {
    if ( err instanceof ApiError && err.erros )
    {
      setErrosCampo ( err.erros );
    }
    else
    {
      setErro ( ( err as Error ).message );
    }
  };

  // RN013/RN018 — lançar é o próprio cadastro: grava a compra e dá entrada no estoque e no
  // custo médio numa transação do Backend; depois disso a compra só pode ser cancelada.
  const Lancar = async () =>
  {
    const validacoes = await Promise.all (
      [ campoFornecedor.validar(), campoTransportadora.validar(), campoCondicao.validar() ]
    );

    if ( validacoes.includes ( false ) )
    {
      return;
    }

    if ( !window.confirm ( 'Lançar a compra? O estoque e o custo médio dos produtos serão atualizados e a compra não poderá mais ser editada.' ) )
    {
      return;
    }

    const dados: CabecalhoCompraInput = {
      codTransp:    campoTransportadora.codigo || null,
      codCondDePag: campoCondicao.codigo,
      dtEmissao:    doInputUtcParaIso ( dtEmissao ),
      dtChegada:    doInputUtcParaIso ( dtChegada ),
      frete:        paraDecimal ( frete ),
      seguro:       paraDecimal ( seguro ),
      despesas:     paraDecimal ( despesas ),
      itens:        itens.map ( paraEntradaItem ),
      parcelas:     parcelas.map ( paraEntradaParcela ),
    };

    await comprasService.criar ( { ...idCompra, ...dados } );

    onConcluido();
  };

  const Executar = async ( acao: () => Promise < void > ) =>
  {
    setLancando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      await acao();
    }
    catch ( err )
    {
      TratarErro ( err );
    }
    finally
    {
      setLancando ( false );
    }
  };

  const submit = ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();

    if ( modo === 'cancelar' )
    {
      // RN014 — justificativa informada, falta o popup de login/confirmação.
      setConfirmandoSenha ( true );
      return;
    }

    if ( modo === 'novo' )
    {
      void Executar ( Lancar );
    }
  };

  const ConfirmarCancelamento = () =>
  {
    setConfirmandoSenha ( false );

    void Executar ( async () =>
    {
      await comprasService.cancelar ( idCompra, { justificativaCancelamento: justificativa } );
      onConcluido();
    } );
  };

  const itemCalculado = ( codProduto: number ) =>
    calculo?.itens.find ( ( item ) => item.codProduto === codProduto );

  const avisoSituacao = compra?.justificativaCancelamento
    ? 'Compra cancelada.'
    : compra
      ? 'Compra lançada — estoque e custos já foram atualizados.'
      : '';

  return (
    <>
      <FormModal titulo={ TITULOS[ modo ] } erro={ erro } onFechar={ onFechar } onSubmit={ submit }>
        { avisoSituacao && somenteLeitura && <Alerta role="status">{ avisoSituacao }</Alerta> }

        {/* Documento (RN007) */}
        <FormSecao>
          <FormCampo label="Modelo" obrigatorio colunas={ 1 } htmlFor="modelo" erro={ erros.modelo }>
            <input
              id="modelo"
              value={ chave.modelo }
              onChange={ ( evento ) => AlterarChave ( 'modelo', evento.target.value ) }
              maxLength={ 2 }
              placeholder="2 dígitos"
              disabled={ chaveValidada }
              required
            />
          </FormCampo>

          <FormCampo label="Número" obrigatorio colunas={ 2 } htmlFor="numero" erro={ erros.numero }>
            <input
              id="numero"
              value={ chave.numero }
              onChange={ ( evento ) => AlterarChave ( 'numero', evento.target.value ) }
              maxLength={ 9 }
              placeholder="9 dígitos"
              disabled={ chaveValidada }
              required
              autoFocus={ modo === 'novo' }
            />
          </FormCampo>
 
          <FormCampo label="Série" obrigatorio colunas={ 1 } htmlFor="serie" erro={ erros.serie }>
            <input
              id="serie"
              value={ chave.serie }
              onChange={ ( evento ) => AlterarChave ( 'serie', evento.target.value ) }
              maxLength={ 2 }
              placeholder="2 dígitos"
              disabled={ chaveValidada }
              required
            />
          </FormCampo> 
        </FormSecao> 

        {/* Fornecedor (parte da chave do documento) e transportadora */}
        <FormSecao>
          <CampoConsulta
            campo={ campoFornecedor }
            Consulta={ FornecedorConsulta }
            rotulo="Fornecedor"
            rotuloCodigo="Código do fornecedor"
            rotuloNome="Nome do fornecedor"
            obrigatorio
            erroApi={ erros.codForn }
            colunas={ [ 2, 1, 6 ] }
            desabilitado={ modo !== 'novo' || chaveValidada }
          />

          {
            modo === 'novo' && (
              <FormCampo label="Chave do documento" colunas={ 2 }>
                <Botao
                  type="button"
                  $variante={ chaveValidada ? 'secundario' : undefined }
                  onClick={ () => { void ValidarChave(); } }
                  disabled={ chaveValidada || validandoChave }
                >
                  { chaveValidada ? 'Chave validada ✓' : validandoChave ? 'Validando…' : 'Validar chave' }
                </Botao>
              </FormCampo>
            )
          }
        </FormSecao>
 
        <FormSecao>
          <CampoConsulta
            campo={ campoTransportadora }
            Consulta={ TransportadoraConsulta }
            rotulo="Transportadora"
            rotuloCodigo="Código da transportadora"
            rotuloNome="Nome da transportadora"
            erroApi={ erros.codTransp }
            colunas={ [ 2, 1.5, 6 ] }
            desabilitado={ !documentoLiberado }
          />
        </FormSecao> 
 
        {/* Produtos — rateio em % e R$ (RN011), totais por coluna e total dos produtos (RN012) */}
        <div>
          <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Produtos</h4>

          {
            produtosLiberados && (
              <CompraItemForm
                codigosNaLista={ itens.map ( ( item ) => item.codProduto ) }
                onAdicionar={ ( item ) => setItens ( [ ...itens, item ] ) }
              />
            )
          }

          {
            itens.length > 0 && (
              <>
                <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '260px' } }>
                  <Tabela>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Produto</th>
                        <th>Un.</th>
                        <th>Qtd.</th>
                        <th>Valor unit. (R$)</th>
                        <th>Desconto (R$)</th>
                        <th>Valor líquido (R$)</th>
                        <th>Porcentagem <br/>de Rateio</th>
                        <th>Valor <br/>de Rateio (R$)</th>
                        <th>Custo unit. (R$)</th>
                        { produtosLiberados && <th>Ações</th> }
                      </tr>
                    </thead>
                    <tbody>
                      {
                        itens.map ( ( item ) =>
                        {
                          const calculado = itemCalculado ( item.codProduto );

                          return (
                            <tr key={ item.codProduto }>
                              <td>{ item.codProduto }</td>
                              <td><InfoBlock title={ item.produto }>{ item.produto }</InfoBlock></td>
                              <td>{ item.unidade }</td>
                              <td style={ { textAlign: 'right' } }>{ item.quantidade }</td>
                              <td style={ { textAlign: 'right' } }>{ paraDecimal ( item.valorUnitario ) }</td>
                              <td style={ { textAlign: 'right' } }>{ paraDecimal ( item.desconto ) }</td>
                              <td style={ { textAlign: 'right' } }>{ calculado?.valorLiquido ?? '—' }</td>
                              <td style={ { textAlign: 'right' } }>{ `${Math.round(Number (calculado?.percentualRateio ?? "0"))}%` }</td>
                              <td style={ { textAlign: 'right' } }>{ calculado?.valorRateio ?? '—' }</td>
                              <td style={ { textAlign: 'right' } }>{ calculado?.custoMedioProduto ?? '—' }</td>
                              {
                                produtosLiberados && (
                                  <td>
                                    <GrupoBotoes>
                                      <Botao
                                        type="button"
                                        $variante="perigo"
                                        onClick={ () => setItens ( itens.filter ( ( outro ) => outro.codProduto !== item.codProduto ) ) }
                                      >
                                        Remover
                                      </Botao>
                                    </GrupoBotoes>
                                  </td>
                                )
                              }
                            </tr>
                          );
                        })
                      }
                    </tbody>
                    {
                      calculo && (
                        <tfoot>
                          <tr>
                            <th colSpan={ 3 }>Totais</th>
                            <th style={ { textAlign: 'right' } }>{ calculo.totalQuantidade }</th>
                            <th style={ { textAlign: 'right' } }>{ calculo.totalValorUnitario }</th>
                            <th style={ { textAlign: 'right' } }>{ calculo.totalDescontos }</th>
                            <th style={ { textAlign: 'right' } }>{ calculo.totalProdutos }</th>
                            {/* <th style={ { textAlign: 'right' } }>{ calculo.totalPercentualRateio }</th>
                            <th style={ { textAlign: 'right' } }>{ calculo.totalRateio }</th> */}
                            {/*<th style={ { textAlign: 'right' } }>{ calculo.totalCustoUnitario }</th>*/}
                            <th/>
                            <th/>
                            <th/>
                            { produtosLiberados && <th /> }
                          </tr>
                        </tfoot>
                      )
                    }
                  </Tabela>
                </TabelaWrapper>

                <div style={ { marginTop: '0.5rem', textAlign: 'left', fontWeight: 600 } }>
                  Total dos produtos: R$ { calculo?.totalProdutos ?? '0.00' }
                </div>
                { erros.itens && <ErroCampo>{ erros.itens }</ErroCampo> }
              </>
            )
          } 
        </div> 

        {/* RN009/RN017 — as três despesas juntas, antes dos produtos (base do rateio) */}

        {/* RN010 — o total da compra vem depois dos subtotais que o compõem */}
        {/* <FormSecao>
          <FormCampo label="Subtotal dos produtos (R$)" colunas={ 3 }>
            <input disabled readOnly value={ calculo?.totalProdutos ?? '0.00' } />
          </FormCampo>
        </FormSecao> */}

        {/* <FormSecao>
          <FormCampo label="Frete (R$)" colunas={ 2 }>
            <input disabled readOnly value={ paraDecimal ( frete ) } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Seguro (R$)" colunas={ 2 }>
            <input disabled readOnly value={ paraDecimal ( seguro ) } />
          </FormCampo>
        </FormSecao>

        <FormSecao>
          <FormCampo label="Outras despesas (R$)" colunas={ 2 }>
            <input disabled readOnly value={ paraDecimal ( despesas ) } />
          </FormCampo>
        </FormSecao> */} 

        {
          itens.length != 0 && (
            <>
              <FormSecao>
                <FormCampo label="Frete (R$)" colunas={ 2 } htmlFor="frete" erro={ erros.frete }>
                  <input
                    id="frete"
                    type="number"
                    min="0"
                    step="0.01"
                    value={ frete }
                    onChange={ ( evento ) => setFrete ( evento.target.value ) }
                    disabled={ !produtosLiberados }
                    placeholder="0.00"
                  />
                </FormCampo>
              </FormSecao>

              <FormSecao>
                <FormCampo label="Seguro (R$)" colunas={ 2 } htmlFor="seguro" erro={ erros.seguro }>
                  <input
                    id="seguro"
                    type="number"
                    min="0"
                    step="0.01"
                    value={ seguro }
                    onChange={ ( evento ) => setSeguro ( evento.target.value ) }
                    disabled={ !produtosLiberados }
                    placeholder="0.00"
                  />
                </FormCampo>
              </FormSecao>

              <FormSecao>
                <FormCampo label="Outras despesas (R$)" colunas={ 2 } htmlFor="despesas" erro={ erros.despesas }>
                  <input
                    id="despesas"
                    type="number"
                    min="0"
                    step="0.01"
                    value={ despesas }
                    onChange={ ( evento ) => setDespesas ( evento.target.value ) }
                    disabled={ !produtosLiberados }
                    placeholder="0.00"
                  />
                </FormCampo>
              </FormSecao>

              <FormSecao>
                <FormCampo label="Total da compra (R$)" colunas={ 3 }>
                  <input disabled readOnly value={ calculo?.vlrTotal ?? '0.00' } style={ { fontWeight: 700 } } />
                </FormCampo>
              </FormSecao> 
            </>
          )
        }

        {/* RN006 — condição herdada do fornecedor, alterável só para esta compra */}
        <FormSecao>
          <CampoConsulta
            campo={ campoCondicao }
            Consulta={ CondicaoPagamentoConsulta }
            rotulo="Condição de pagamento"
            rotuloCodigo="Código da condição"
            rotuloNome="Descrição da condição"
            obrigatorio
            erroApi={ erros.codCondDePag }
            colunas={ [ 2, 1, 5 ] }
            desabilitado={ !produtosLiberados }
          />
        </FormSecao>

        {/* RN021/RN022/RN023 — parcelas da compra, geradas pela condição e ajustáveis só aqui */}
        <div> 
          <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Parcelas</h4>
          {
            camposLiberados && (
              <>
                <GrupoBotoes style={ { marginBottom: '0.75rem' } }>
                  <Botao
                    type="button"
                    onClick={ () => { void GerarParcelas(); } }
                    disabled={ gerandoParcelas || itens.length === 0 || !calculo || !campoCondicao.codigo }
                  >
                    { gerandoParcelas ? 'Gerando…' : parcelas.length > 0 ? 'Gerar parcelas de novo' : 'Gerar parcelas' }
                  </Botao>
                  {
                    parcelas.length > 0 && (
                      <Botao type="button" $variante="secundario" onClick={ DescartarParcelas }>
                        Descartar parcelas
                      </Botao>
                    )
                  }
                </GrupoBotoes>
              </>
            )
          }
          {
            parcelas.length > 0 && (
              <>
                <CompraParcelas
                  parcelas={ parcelas }
                  onAlterar={ setParcelas }
                  somenteLeitura={ somenteLeitura }
                  totalCompra={ totalCompra }
                  erro={ erros.parcelas }
                /> 
              </>
            )
          } 
        </div> 

        <FormSecao> 
          <FormCampo label="Emissão (UTC)" obrigatorio colunas={ 2.3 } htmlFor="dtEmissao" erro={ erros.dtEmissao }>
            <input
              id="dtEmissao"
              type="datetime-local"
              value={ dtEmissao }
              onChange={ ( evento ) => setDtEmissao ( evento.target.value ) }
              disabled={ !datasLiberadas || !calculo }
              required
            />
          </FormCampo>

          <FormCampo label="Chegada (UTC)" obrigatorio colunas={ 2.3 } htmlFor="dtChegada" erro={ erros.dtChegada }>
            <input
              id="dtChegada"
              type="datetime-local"
              value={ dtChegada }
              onChange={ ( evento ) => setDtChegada ( evento.target.value ) }
              min={ dtEmissao || undefined }
              disabled={ !datasLiberadas || !calculo }
              required
            />
          </FormCampo>
        </FormSecao> 

        {/* RN015 — saldo e preço de venda ao final */}
        {
          calculo && (
            <div>
              <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Saldo e preço de venda</h4>
              <TabelaWrapper style={ { height: 'auto', maxHeight: '220px' } }>
                <Tabela>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Estoque atual</th>
                      { modo === 'novo' && <th>Saldo após o lançamento</th> }
                      { modo === 'novo' && <th>Custo médio após o lançamento (R$)</th> }
                      <th>Preço de venda (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      calculo.itens.map ( ( item ) => (
                        <tr key={ item.codProduto }>
                          <td><InfoBlock title={ item.produto }>{ item.produto }</InfoBlock></td>
                          <td>{ item.estoqueAtual }</td>
                          { modo === 'novo' && <td>{ item.estoqueResultante }</td> }
                          { modo === 'novo' && <td>{ item.custoMedioResultante }</td> }
                          <td>{ item.precoVenda }</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </Tabela>
              </TabelaWrapper>
            </div>
          )
        } 

        {/* RN014 — justificativa do cancelamento */}
        {
          ( modo === 'cancelar' || compra?.justificativaCancelamento ) && (
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
            { somenteLeitura ? 'Voltar' : 'Cancelar' }
          </Botao>
          {
            modo === 'novo' && (
              <Botao type="submit" disabled={ lancando || !chaveValidada || itens.length === 0 || !parcelasFecham }>
                { lancando ? 'Lançando…' : 'Lançar compra' }
              </Botao>
            )
          }
          {
            modo === 'cancelar' && (
              <Botao type="submit" $variante="perigo" disabled={ lancando }>
                { lancando ? 'Cancelando…' : 'Confirmar cancelamento' }
              </Botao>
            )
          }
        </FormAcoes>
      </FormModal>

      {
        confirmandoSenha && (
          <ConfirmarSenhaModal
            titulo="Confirme sua identidade para cancelar a compra"
            onConfirmar={ ConfirmarCancelamento }
            onCancelar={ () => setConfirmandoSenha ( false ) }
          />
        )
      }
    </>
  );
}
