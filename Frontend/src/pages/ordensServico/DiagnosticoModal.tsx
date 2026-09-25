import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { ordensServicoService, type OrdemServico } from '../../services/ordensServico';
import { procedimentosService } from '../../services/procedimentos';
import { pecasService } from '../../services/pecas';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao, GrupoBotoes, TabelaWrapper, Tabela } from './style';
import { OrcamentoPecaOdSForm, type OrcamentoPecaOdSLocal } from './OrcamentoPecaOdSForm';

interface ProcedimentoChecagemLocal
{
  codProcedimento:  number;
  nomeProcedimento: string;
  posicao:          string;
  checagem:         boolean;
  dthFim:           string;
  obsProcedimento:  string;
}

interface Props
{
  os:         OrdemServico;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function DiagnosticoModal ( { os, onSalvo, onCancelar }: Props )
{
  'use no memo';
  const [ historicoManutencao, setHistoricoManutencao ] = useState ( '' );
  const [ procedimentos, setProcedimentos ]   = useState < ProcedimentoChecagemLocal[] > ( [] );
  const [ orcamentoPecas, setOrcamentoPecas ] = useState < OrcamentoPecaOdSLocal[] > ( [] );
  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );
  const [ carregando, setCarregando ] = useState ( true );

  useEffect ( () =>
  {
    async function CarregarDados ()
    {
      const [ detalhe, catalogoProcedimentos, catalogoPecas ] = await Promise.all ( [
        ordensServicoService.obter ( os.numOdS ),
        procedimentosService.listar ( { limit: 100 } ),
        pecasService.listar ( { limit: 100 } ),
      ] );

      const nomesProcedimentoMap: Record < number, string > = {};
      catalogoProcedimentos.forEach ( ( procedimento ) =>
      {
        nomesProcedimentoMap [ procedimento.codProcedimento ] = procedimento.procedimento;
      } );

      const nomesPecaMap: Record < number, string > = {};
      catalogoPecas.forEach ( ( peca ) =>
      {
        nomesPecaMap [ peca.codPeca ] = peca.peca;
      } );

      const hoje = new Date().toISOString().slice ( 0, 10 );

      setHistoricoManutencao ( detalhe.historicoManutencao ?? '' );
      setProcedimentos (
        [ ...detalhe.procedimentos ]
          .sort ( ( a, b ) => a.ordem - b.ordem )
          .map ( ( item ) => ( {
            codProcedimento:  item.codProcedimento,
            nomeProcedimento: nomesProcedimentoMap [ item.codProcedimento ] ?? String ( item.codProcedimento ),
            posicao:          item.posicao ?? '',
            checagem:         item.checagem ?? false,
            dthFim:           item.dthFim ? item.dthFim.slice ( 0, 10 ) : hoje,
            obsProcedimento:  item.obsProcedimento ?? '',
          } ) )
      );
      setOrcamentoPecas ( detalhe.orcamentoPecas.map ( ( item ) => ({
        _uid:     `${ item.codPeca }`,
        codPeca:  item.codPeca,
        nomePeca: nomesPecaMap [ item.codPeca ] ?? String ( item.codPeca ),
        vlrPv:    item.vlrPv,
        aprovado: item.aprovado,
      }) ) );
      setCarregando ( false );
    }

    CarregarDados().catch ( ( err: Error ) => { setErro ( err.message ); setCarregando ( false ); } );
  }, [ os.numOdS ] );

  const HandleAtualizarProcedimento = (
    codProcedimento: number,
    campo:           Partial < ProcedimentoChecagemLocal >
  ) =>
  {
    setProcedimentos ( ( anterior ) =>
      anterior.map ( ( item ) =>
        item.codProcedimento === codProcedimento ? { ...item, ...campo } : item
      )
    );
  };

  const HandleAdicionarPeca = ( item: OrcamentoPecaOdSLocal ) =>
  {
    setOrcamentoPecas ( ( anterior ) =>
      [ ...anterior.filter ( ( existente ) => existente.codPeca !== item.codPeca ), item ]
    );
  };

  const HandleRemoverPeca = ( uid: string ) =>
  {
    setOrcamentoPecas ( ( anterior ) => anterior.filter ( ( item ) => item._uid !== uid ) );
  };

  const procedimentosPendentes = procedimentos.filter ( ( item ) =>
    !item.posicao.trim() || !item.dthFim || ( !item.checagem && !item.obsProcedimento.trim() )
  );
  const podeSalvar = procedimentos.length === 0 || procedimentosPendentes.length === 0;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();

    if ( !podeSalvar )
    {
      return;
    }

    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      await ordensServicoService.registrarDiagnostico ( os.numOdS, {
        historicoManutencao: historicoManutencao || null,
        procedimentos: procedimentos.map ( ( item ) => ({
          codProcedimento: item.codProcedimento,
          posicao:         item.posicao,
          checagem:        item.checagem,
          dthFim:          item.dthFim,
          obsProcedimento: item.obsProcedimento || null,
        }) ),
        orcamentoPecas: orcamentoPecas.map ( ( item ) => ({
          codPeca: item.codPeca,
          vlrPv:   item.vlrPv,
        }) ),
      } );

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
    <FormModal
      titulo={ `Diagnóstico da OS ${ os.numOdS }` }
      erro={ erro || errosCampo.procedimentos }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <div>
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Checklist de procedimentos</h4>
        {
          !carregando && procedimentos.length === 0 && (
            <p style={ { fontSize: '0.875rem' } }>
              Nenhum procedimento definido para esta OS — use a tela de
              {' '}
              <a href={ `/procedimentos-os?numOdS=${ os.numOdS }` }>Procedimentos</a>
              {' '}
              para montar a checklist antes de registrar o diagnóstico.
            </p>
          )
        }
        {
          procedimentos.length > 0 && (
            <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '320px' } }>
              <Tabela>
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th>Data de finalização</th>
                    <th>Posição</th>
                    <th>Checagem confirmada?</th> 
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    procedimentos.map ( ( item ) => (
                      <tr key={ item.codProcedimento }>
                        <td>{ item.nomeProcedimento }</td>
                        <td>
                          <input
                            type="date"
                            value={ item.dthFim }
                            onChange={ ( evento ) => HandleAtualizarProcedimento ( item.codProcedimento, { dthFim: evento.target.value } ) }
                          />
                        </td>
                        <td>
                          <input
                            value={ item.posicao }
                            onChange={ ( evento ) => HandleAtualizarProcedimento ( item.codProcedimento, { posicao: evento.target.value } ) }
                            maxLength={ 8 }
                          />
                        </td> 
                        <td>
                          <CaixaSelecao
                            value={ item.checagem }
                            onChange={ ( novoValor ) => HandleAtualizarProcedimento ( item.codProcedimento, { checagem: novoValor } ) }
                          />
                        </td> 
                        <td>
                          <input
                            value={ item.obsProcedimento }
                            onChange={ ( evento ) => HandleAtualizarProcedimento ( item.codProcedimento, { obsProcedimento: evento.target.value } ) }
                            maxLength={ 244 }
                          />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </Tabela>
            </TabelaWrapper>
          )
        }
      </div>

      <FormSecao>
        <FormCampo label="Histórico de manutenção" colunas={ 12 } htmlFor="historicoManutencao" erro={ errosCampo.historicoManutencao }>
          <textarea
            id="historicoManutencao"
            value={ historicoManutencao }
            onChange={ ( evento ) => setHistoricoManutencao ( evento.target.value ) }
            maxLength={ 2000 }
          />
        </FormCampo>
      </FormSecao>

      <div>
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Orçamento de peças</h4>
        <OrcamentoPecaOdSForm onAdicionar={ HandleAdicionarPeca } />
        {
          orcamentoPecas.length > 0 && (
            <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '200px' } }>
              <Tabela>
                <thead>
                  <tr>
                    <th>Código da Peça</th>
                    <th>Peça</th>
                    <th>Valor de Venda</th>
                    <th>Aprovado?</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    orcamentoPecas.map ( ( item ) => (
                      <tr key={ item._uid }>
                        <td>{ item.codPeca }</td>
                        <td>{ item.nomePeca }</td>
                        <td>{ item.vlrPv }</td>
                        <td>{ item.aprovado ? 'Sim' : 'Não' }</td>
                        <td>
                          <GrupoBotoes>
                            <Botao
                              type="button"
                              $variante="perigo"
                              onClick={ () => HandleRemoverPeca ( item._uid ) }
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
      </div>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ salvando || carregando || !podeSalvar }>
          { salvando ? 'Salvando…' : 'Salvar diagnóstico' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
