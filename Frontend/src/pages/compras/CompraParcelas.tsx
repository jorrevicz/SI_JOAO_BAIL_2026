import { useEffect, useState } from 'react';
import { formasPagamentoService, type FormaPagamento } from '../../services/formasPagamento';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { FormaPagamentoConsulta } from '../formasPagamento/FormaPagamentoConsulta';
import type { ParcelaLocal } from './parcelas';
import { emCentavos, somaParcelasEmCentavos } from './parcelas';
import { ParcelaCompraEdicaoModal } from './ParcelaCompraEdicaoModal';
import { TabelaWrapper, Tabela, Botao, ErroCampo, FormSecao, FormCampo } from './style';

interface Props
{
  parcelas:      ParcelaLocal[];
  onAlterar:     ( parcelas: ParcelaLocal[] ) => void;
  somenteLeitura: boolean;
  // Total da compra calculado pelo Backend — a soma das parcelas precisa fechar nele.
  totalCompra:   string | null;
  erro?:         string;
}

const paraReais = ( centavos: number ) => ( centavos / 100 ).toFixed ( 2 );

export function CompraParcelas ( { parcelas, onAlterar, somenteLeitura, totalCompra, erro }: Props )
{
  const [ formas, setFormas ] = useState < FormaPagamento[] > ( [] );

  // Campos de preenchimento da nova parcela (acima da tabela, como nos itens da compra)
  const campoForma = useCampoConsulta (
    {
      codigoInicial: null,
      buscar:        formasPagamentoService.obter,
      codigoDe:      ( forma ) => forma.codFormaDePag,
      descricaoDe:   ( forma ) => forma.formaDePag,
    }
  );
  const [ numParcela, setNumParcela ]       = useState ( '' );
  const [ valor, setValor ]                 = useState ( '' );
  const [ dtVencimento, setDtVencimento ]   = useState ( '' );
  // Parcela aberta no modal de edição (RN023): o ajuste vale só para a compra e nunca
  // altera a condição de pagamento nem suas Parcelas originais.
  const [ emEdicao, setEmEdicao ] = useState < ParcelaLocal | null > ( null );
  const [ erroNumParcela, setErroNumParcela ] = useState ( '' );
  const [ erroForma, setErroForma ]         = useState ( '' );
  const [ erroValor, setErroValor ]         = useState ( '' );
  const [ erroVencimento, setErroVencimento ] = useState ( '' );

  // Só para mostrar o nome da forma nas linhas geradas pelo Backend (que trazem o código).
  useEffect ( () =>
  {
    formasPagamentoService
      .listar ( { limit: 100 } )
      .then ( setFormas )
      .catch ( () => undefined );
  }, [] );

  const proximoNumero = Math.max ( 0, ...parcelas.map ( ( parcela ) => parcela.numParcela ) ) + 1;

  const Adicionar = async () =>
  {
    const numero = Number ( numParcela || proximoNumero );

    if ( !Number.isInteger ( numero ) || numero <= 0 )
    {
      setErroNumParcela ( 'Informe um número de parcela inteiro maior que zero.' );
      return;
    }

    if ( parcelas.some ( ( parcela ) => parcela.numParcela === numero ) )
    {
      setErroNumParcela ( 'Já existe uma parcela com este número.' );
      return;
    }

    setErroNumParcela ( '' );

    const forma = await campoForma.resolver();

    if ( !forma )
    {
      setErroForma ( campoForma.codigo ? '' : 'Selecione uma forma de pagamento.' );
      return;
    }

    setErroForma ( '' );

    // Valor e vencimento são obrigatórios; as demais regras (soma, ordem) são do Backend.
    setErroValor ( emCentavos ( valor ) > 0 ? '' : 'Informe um valor maior que zero.' );
    setErroVencimento ( dtVencimento ? '' : 'Informe o vencimento.' );

    if ( emCentavos ( valor ) <= 0 || !dtVencimento )
    {
      return;
    }

    onAlterar ( [
      ...parcelas,
      { numParcela: numero, codFormaDePag: String ( forma.codFormaDePag ), valor, dtVencimento },
    ] );

    campoForma.digitar ( '' );
    setNumParcela ( '' );
    setValor ( '' );
    setDtVencimento ( '' );
  };

  const nomeDaForma = ( codigo: string ) =>
    formas.find ( ( forma ) => String ( forma.codFormaDePag ) === codigo )?.formaDePag ?? '—';

  const soma      = somaParcelasEmCentavos ( parcelas );
  const total     = totalCompra === null ? null : emCentavos ( totalCompra );
  const divergente = total !== null && soma !== total;

  return (
    <div>
      {
        !somenteLeitura && (
          <>
            <FormSecao>
              <FormCampo label="Nº da parcela" colunas={ 1 } htmlFor="parcelaNumero" erro={ erroNumParcela }>
                <input
                  id="parcelaNumero"
                  type="number"
                  min="1"
                  step="1"
                  value={ numParcela }
                  onChange={ ( evento ) => setNumParcela ( evento.target.value ) }
                  placeholder={ String ( proximoNumero ) }
                />
              </FormCampo> 

              <CampoConsulta
                campo={ campoForma }
                Consulta={ FormaPagamentoConsulta }
                rotulo="Forma de pagamento"
                rotuloCodigo="Código da forma"
                rotuloNome="Descrição da forma"
                obrigatorio
                erroApi={ erroForma }
                colunas={ [ 2, 1, 4 ] }
              />

            
              <FormCampo label="Valor (R$)" obrigatorio colunas={ 1.5 } htmlFor="parcelaValor" erro={ erroValor }>
                <input
                  id="parcelaValor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={ valor }
                  onChange={ ( evento ) => setValor ( evento.target.value ) }
                  placeholder="0.00"
                />
              </FormCampo>

              <FormCampo label="Vencimento (UTC)" obrigatorio colunas={ 2.3 } htmlFor="parcelaVencimento" erro={ erroVencimento }>
                <input
                  id="parcelaVencimento"
                  type="datetime-local"
                  value={ dtVencimento }
                  onChange={ ( evento ) => setDtVencimento ( evento.target.value ) }
                />
              </FormCampo>
            </FormSecao>

            <FormSecao>
              <FormCampo colunas={ 12 }>
                <div style={ { marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' } }>
                  <Botao type="button" onClick={ () => { void Adicionar(); } }>Adicionar</Botao>
                </div>
             </FormCampo>
            </FormSecao>
          </>
        )
      }

      {
        parcelas.length > 0 && (
          <TabelaWrapper style={ { height: 'auto', maxHeight: '260px', marginTop: '0.75rem' } }>
            <Tabela>
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Cód. forma</th>
                  <th>Forma de pagamento</th>
                  <th>Valor (R$)</th>
                  <th>Vencimento</th>
                  {/* { !somenteLeitura && <th>Ações</th> } */}
                </tr>
              </thead>
              <tbody>
                {
                  [ ...parcelas ].sort ( ( primeira, segunda ) => primeira.numParcela - segunda.numParcela ).map ( ( parcela ) => (
                    <tr key={ parcela.numParcela }>
                      <td>{ parcela.numParcela }</td>
                      <td>{ parcela.codFormaDePag }</td>
                      <td>{ nomeDaForma ( parcela.codFormaDePag ) }</td>
                      <td style={ { textAlign: 'right' } }>{ Number ( parcela.valor || 0 ).toFixed ( 2 ) }</td>
                      <td>{ parcela.dtVencimento}</td>
                      {/* ? formatarDataHora ( doInputUtcParaIso ( parcela.dtVencimento ) ) : '—' }</td>
                      {
                        !somenteLeitura && (
                          <td>
                            <GrupoBotoes>
                              <Botao type="button" $variante="secundario" onClick={ () => setEmEdicao ( parcela ) }>
                                Editar
                              </Botao>
                              <Botao
                                type="button"
                                $variante="perigo"
                                onClick={ () => onAlterar ( parcelas.filter ( ( outra ) => outra.numParcela !== parcela.numParcela ) ) }
                              >
                                Remover
                              </Botao>
                            </GrupoBotoes>
                        )
                      }*/}
                    </tr>
                  ) )
                }
              </tbody>
            </Tabela>
          </TabelaWrapper>
        )
      }

      {
        parcelas.length > 0 && (
          <div style={ { marginTop: '0.5rem', fontWeight: 600 } }>
            Total das parcelas: R$ { paraReais ( soma ) }
            { total !== null && ` de R$ ${ paraReais ( total ) }` }
          </div>
        )
      }

      {
        divergente && !somenteLeitura && (
          <ErroCampo>
            { `A soma das parcelas deve ser igual ao total da compra (diferença de R$ ${ paraReais ( Math.abs ( total! - soma ) ) }).` }
          </ErroCampo>
        )
      }

      { erro && <ErroCampo>{ erro }</ErroCampo> }

      {
        emEdicao && (
          <ParcelaCompraEdicaoModal
            parcela={ emEdicao }
            onSalvar={ ( ajustada ) =>
            {
              onAlterar ( parcelas.map ( ( parcela ) => ( parcela.numParcela === ajustada.numParcela ? ajustada : parcela ) ) );
              setEmEdicao ( null );
            } }
            onFechar={ () => setEmEdicao ( null ) }
          />
        )
      }
    </div>
  );
}
