import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import {
  condicoesPagamentoService,
  type CondicaoPagamento,
  type CreateCondicaoPagamentoInput,
  type UpdateCondicaoPagamentoInput,
} from '../../services/condicoesPagamento';
import { parcelasService } from '../../services/parcelas';
import { formasPagamentoService } from '../../services/formasPagamento';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao, GrupoBotoes, TabelaWrapper, Tabela, ErroCampo } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { ParcelaForm, type ParcelaLocal } from './ParcelaForm';

interface Props
{
  inicial:     Partial < CondicaoPagamento >;
  onSalvo:     ( salvo: CondicaoPagamento ) => void;
  onCancelar:  () => void;
}

export default function CondicaoPagamentoForm ( { inicial, onSalvo, onCancelar }: Props )
{
  'use no memo'
  // Juros/multa/desconto aceitam ficar em branco na tela — o valor é preenchido com
  // 0.00 apenas ao montar o payload de envio (submit), não enquanto o usuário digita.
  const [ form, setForm ] = useState < Omit < CreateCondicaoPagamentoInput, 'parcelas' | 'juroCondPag' | 'multaCondPag' | 'descontoCondPag' > & {
    juroCondPag:     number | undefined;
    multaCondPag:    number | undefined;
    descontoCondPag: number | undefined;
  } > ({
    descricao:       inicial.descricao       ?? '',
    juroCondPag:     inicial.juroCondPag     != null ? parseFloat ( inicial.juroCondPag )     : undefined,
    multaCondPag:    inicial.multaCondPag    != null ? parseFloat ( inicial.multaCondPag )    : undefined,
    descontoCondPag: inicial.descontoCondPag != null ? parseFloat ( inicial.descontoCondPag ) : undefined,
    isActive:        inicial.isActive        ?? true,
  });
  const [ parcelas, setParcelas ] = useState < ParcelaLocal[] > ( [] );
  const [ erro, setErro ]         = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ({});
  const [ salvando, setSalvando ] = useState ( false );

  const editando = !!inicial.codCondDePag;

  useEffect ( () =>
  {
    async function CarregarDados ()
    {
      const formas = await formasPagamentoService.listar();
      const formasMap: Record < number, string > = {};
      formas.forEach ( ( forma ) =>
      {
        formasMap [ forma.codFormaDePag ] = forma.formaDePag;
      });

      if ( inicial.codCondDePag )
      {
        const lista = await parcelasService.listar ( inicial.codCondDePag );
        setParcelas ( lista.map ( ( parcela ) => ({
          _uid:          String ( parcela.numParcela ),
          numParcela:    parcela.numParcela,
          codFormaDePag: parcela.codFormaDePag,
          nomeFormaPag:  formasMap [ parcela.codFormaDePag ] ?? String ( parcela.codFormaDePag ),
          percentual:    parseFloat ( parcela.percentual ),
          numDias:       parcela.numDias,
          isActive:      parcela.isActive,
        }) ) );
      }
    }

    CarregarDados().catch ( ( err: Error ) => setErro ( err.message ) );
  }, [ inicial.codCondDePag ] );

  const HandleAdicionar = ( parcela: ParcelaLocal ) =>
  {
    setParcelas ( ( anterior ) =>
      [ ...anterior, parcela ].sort ( ( a, b ) => a.numParcela - b.numParcela )
    );
  };

  const HandleRemover = ( uid: string ) =>
  {
    setParcelas ( ( anterior ) => anterior.filter ( ( parcela ) => parcela._uid !== uid ) );
  };

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      const parcelasMapeadas = parcelas.map ( ( parcela ) => ({
        numParcela:    parcela.numParcela,
        codFormaDePag: parcela.codFormaDePag,
        percentual:    parcela.percentual,
        numDias:       parcela.numDias,
        isActive:      parcela.isActive,
      }) );

      if ( editando )
      {
        const payload: UpdateCondicaoPagamentoInput =
        {
          descricao: form.descricao,
          isActive:  form.isActive,
          parcelas:  parcelasMapeadas,
        };
        onSalvo ( await condicoesPagamentoService.atualizar ( inicial.codCondDePag!, payload ) );
      }
      else
      {
        const payload: CreateCondicaoPagamentoInput =
        {
          ...form,
          juroCondPag:     form.juroCondPag     ?? 0,
          multaCondPag:    form.multaCondPag    ?? 0,
          descontoCondPag: form.descontoCondPag ?? 0,
          parcelas: parcelasMapeadas,
        };
        onSalvo ( await condicoesPagamentoService.criar ( payload ) );
      }

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

  const totalPercentual  = parcelas.reduce ( ( acc, parcela ) => acc + parcela.percentual, 0 );
  const totalValido      = Math.round ( totalPercentual * 100 ) === 10000;
  const podeSalvar       = !salvando && parcelas.length > 0 && totalValido;

  return (
    <FormModal
      titulo={ editando ? 'Editar condição de pagamento' : 'Nova condição de pagamento' }
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Descrição" obrigatorio colunas={ 7 } htmlFor="descricao" erro={ errosCampo.descricao }>
          <input
            id="descricao"
            value={ form.descricao }
            onChange={ ( evento ) => setForm ( { ...form, descricao: evento.target.value.toUpperCase() } ) }
            maxLength={ 60 }
            required
            autoFocus
          />
        </FormCampo>

        <FormCampo label="Juros (%)" colunas={ 1.5 } htmlFor="juroCondPag" erro={ errosCampo.juroCondPag }>
          <input
            id="juroCondPag"
            type="number"
            step="0.01"
            min="0"
            value={ form.juroCondPag ?? '' }
            onChange={ ( evento ) =>
              setForm ( { ...form, juroCondPag: evento.target.value ? parseFloat ( evento.target.value ) : undefined } )
            }
            placeholder="0.00"
            disabled={ editando }
            readOnly={ editando }
          />
        </FormCampo>

        <FormCampo label="Multa (%)" colunas={ 1.5 } htmlFor="multaCondPag" erro={ errosCampo.multaCondPag }>
          <input
            id="multaCondPag"
            type="number"
            step="0.01"
            min="0"
            value={ form.multaCondPag ?? '' }
            onChange={ ( evento ) =>
              setForm ( { ...form, multaCondPag: evento.target.value ? parseFloat ( evento.target.value ) : undefined } )
            }
            placeholder="0.00"
            disabled={ editando }
            readOnly={ editando }
          />
        </FormCampo>

        <FormCampo label="Desconto (%)" colunas={ 1.5 } htmlFor="descontoCondPag" erro={ errosCampo.descontoCondPag }>
          <input
            id="descontoCondPag"
            type="number"
            step="0.01"
            min="0"
            value={ form.descontoCondPag ?? '' }
            onChange={ ( evento ) =>
              setForm ( { ...form, descontoCondPag: evento.target.value ? parseFloat ( evento.target.value ) : undefined } )
            }
            placeholder="0.00"
            disabled={ editando }
            readOnly={ editando }
          />
        </FormCampo>

        <FormCampo label="Status" colunas={ 2 }>
          <CaixaSelecao
            value={ form.isActive }
            onChange={ ( evento ) => setForm ( { ...form, isActive: evento } ) }
          />
        </FormCampo>
      </FormSecao>

      <div>
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Parcelas</h4>
        <ParcelaForm
          onAdicionar={ HandleAdicionar }
          numerosExistentes={ parcelas.map ( ( parcela ) => parcela.numParcela ) }
        />
        {
          parcelas.length > 0 && (
            <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '200px' } }>
              <Tabela>
                <thead>
                  <tr>
                    <th>Nº da Parcela</th>
                    <th>Código da Forma de Pagamento</th>
                    <th>Forma de Pagamento</th>
                    <th>Percentual (%)</th>
                    <th>Dias</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    parcelas.map ( ( parcela ) => (
                      <tr key={ parcela._uid }>
                        <td>{ parcela.numParcela }</td>
                        <td>{ parcela.codFormaDePag }</td>
                        <td>{ parcela.nomeFormaPag }</td>
                        <td>{ parcela.percentual.toFixed ( 2 ) }%</td>
                        <td>{ parcela.numDias === 1 ? 'À vista' : `${ parcela.numDias }d` }</td>
                        <td>{ parcela.isActive ? 'Ativo' : 'Inativo' }</td>
                        <td>
                          <GrupoBotoes>
                            <Botao
                              type="button"
                              $variante="perigo"
                              onClick={ () => HandleRemover ( parcela._uid ) }
                            >
                              Excluir
                            </Botao>
                          </GrupoBotoes>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </Tabela>
            </TabelaWrapper>
          )
        }
        <div style={ { marginTop: '0.5rem', textAlign: 'right' } }>
          <span style={ { fontWeight: 600, color: totalValido ? 'inherit' : 'var(--cor-erro, #c0392b)' } }>
            Total: { totalPercentual.toFixed ( 2 ) }%{ !totalValido }
          </span>
        </div>
        { errosCampo.parcelas && <ErroCampo>{ errosCampo.parcelas }</ErroCampo> }
      </div>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ !podeSalvar }>
          { salvando ? 'Salvando…' : 'Salvar' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
