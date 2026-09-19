import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { ordensServicoService, type OrdemServico } from '../../services/ordensServico';
import { procedimentosService } from '../../services/procedimentos';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao, GrupoBotoes, TabelaWrapper, Tabela } from './style';
import { ProcedimentoOdSForm, type ProcedimentoOdSLocal } from './ProcedimentoOdSForm';

interface Props
{
  os:         OrdemServico;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function DiagnosticoModal ( { os, onSalvo, onCancelar }: Props )
{
  'use no memo';
  const [ obsTecnica, setObsTecnica ] = useState ( '' );
  const [ historicoManutencao, setHistoricoManutencao ] = useState ( '' );
  const [ procedimentos, setProcedimentos ] = useState < ProcedimentoOdSLocal[] > ( [] );
  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );
  const [ carregando, setCarregando ] = useState ( true );

  useEffect ( () =>
  {
    async function CarregarDados ()
    {
      const [ detalhe, catalogo ] = await Promise.all ( [
        ordensServicoService.obter ( os.numOdS ),
        procedimentosService.listar ( { limit: 100 } ),
      ] );

      const nomesMap: Record < number, string > = {};
      catalogo.forEach ( ( procedimento ) =>
      {
        nomesMap [ procedimento.codProcedimento ] = procedimento.procedimento;
      } );

      setObsTecnica ( detalhe.obsTecnica ?? '' );
      setHistoricoManutencao ( detalhe.historicoManutencao ?? '' );
      setProcedimentos ( detalhe.procedimentos.map ( ( item ) => ({
        _uid:             `${ item.codProcedimento }`,
        codProcedimento:  item.codProcedimento,
        nomeProcedimento: nomesMap [ item.codProcedimento ] ?? String ( item.codProcedimento ),
        posicao:          item.posicao,
        checagem:         item.checagem,
        obsProcedimento:  item.obsProcedimento,
      }) ) );
      setCarregando ( false );
    }

    CarregarDados().catch ( ( err: Error ) => { setErro ( err.message ); setCarregando ( false ); } );
  }, [ os.numOdS ] );

  const HandleAdicionar = ( item: ProcedimentoOdSLocal ) =>
  {
    setProcedimentos ( ( anterior ) =>
      [ ...anterior.filter ( ( existente ) => existente.codProcedimento !== item.codProcedimento ), item ]
    );
  };

  const HandleRemover = ( uid: string ) =>
  {
    setProcedimentos ( ( anterior ) => anterior.filter ( ( item ) => item._uid !== uid ) );
  };

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      await ordensServicoService.registrarDiagnostico ( os.numOdS, {
        obsTecnica:           obsTecnica || null,
        historicoManutencao:  historicoManutencao || null,
        procedimentos: procedimentos.map ( ( item ) => ({
          codProcedimento:  item.codProcedimento,
          posicao:          item.posicao,
          checagem:         item.checagem,
          obsProcedimento:  item.obsProcedimento,
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
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Observação técnica" colunas={ 12 } htmlFor="obsTecnica" erro={ errosCampo.obsTecnica }>
          <textarea
            id="obsTecnica"
            value={ obsTecnica }
            onChange={ ( evento ) => setObsTecnica ( evento.target.value ) }
            maxLength={ 244 }
          />
        </FormCampo>

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
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Checklist de procedimentos</h4>
        <ProcedimentoOdSForm onAdicionar={ HandleAdicionar } />
        {
          procedimentos.length > 0 && (
            <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '200px' } }>
              <Tabela>
                <thead>
                  <tr>
                    <th>Código do Procedimento</th>
                    <th>Posição</th>
                    <th>Checagem</th>
                    <th>Observação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    procedimentos.map ( ( item ) => (
                      <tr key={ item._uid }>
                        <td>{ item.nomeProcedimento }</td>
                        <td>{ item.posicao }</td>
                        <td>{ item.checagem }</td>
                        <td>{ item.obsProcedimento ?? '—' }</td>
                        <td>
                          <GrupoBotoes>
                            <Botao
                              type="button"
                              $variante="perigo"
                              onClick={ () => HandleRemover ( item._uid ) }
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
        <Botao type="submit" disabled={ salvando || carregando }>
          { salvando ? 'Salvando…' : 'Salvar diagnóstico' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
