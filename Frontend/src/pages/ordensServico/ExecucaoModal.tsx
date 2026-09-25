import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { ordensServicoService, type OrdemServico } from '../../services/ordensServico';
import { servicosService } from '../../services/servicos';
import { pecasService } from '../../services/pecas';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao, GrupoBotoes, TabelaWrapper, Tabela } from './style';
import { ServicoOdSForm, type ServicoOdSLocal } from './ServicoOdSForm';
import { SubstituirPecaOdSForm, type SubstituirPecaOdSLocal } from './SubstituirPecaOdSForm';

interface Props
{
  os:         OrdemServico;
  onSalvo:    () => void;
  onCancelar: () => void;
}

export default function ExecucaoModal ( { os, onSalvo, onCancelar }: Props )
{
  'use no memo';
  const [ servicos, setServicos ]             = useState < ServicoOdSLocal[] > ( [] );
  const [ substituicaoPecas, setSubstituicaoPecas ] = useState < SubstituirPecaOdSLocal[] > ( [] );
  const [ obsTecnica, setObsTecnica ] = useState ( '' );
  const [ erro, setErro ]             = useState ( '' );
  const [ salvando, setSalvando ]     = useState ( false );
  const [ carregando, setCarregando ] = useState ( true );

  useEffect ( () =>
  {
    async function CarregarDados ()
    {
      const [ detalhe, catalogoServicos, catalogoPecas ] = await Promise.all ( [
        ordensServicoService.obter ( os.numOdS ),
        servicosService.listar ( { limit: 100 } ),
        pecasService.listar ( { limit: 100 } ),
      ] );

      const nomesServicoMap: Record < number, string > = {};
      const funcionarioPorServico: Record < number, number > = {};
      catalogoServicos.forEach ( ( servico ) =>
      {
        nomesServicoMap [ servico.codServico ] = servico.servico;
        funcionarioPorServico [ servico.codServico ] = servico.codFuncionario;
      } );

      const nomesPecaMap: Record < number, string > = {};
      catalogoPecas.forEach ( ( peca ) =>
      {
        nomesPecaMap [ peca.codPeca ] = peca.peca;
      } );

      setObsTecnica ( detalhe.obsTecnica ?? '' );

      setServicos ( detalhe.servicos.map ( ( item ) =>
      {
        const codFuncionario = funcionarioPorServico [ item.codServico ] ?? 0;
        const servicoCatalogo = catalogoServicos.find ( ( servico ) => servico.codServico === item.codServico );

        return {
          _uid:            `${ item.codServico }`,
          codServico:      item.codServico,
          nomeServico:     nomesServicoMap [ item.codServico ] ?? String ( item.codServico ),
          valorUnitario:   servicoCatalogo?.valor ?? '0.00',
          codFuncionario,
          nomeFuncionario: '',
          qtdServico:      item.qtdServico,
        };
      } ) );

      setSubstituicaoPecas ( detalhe.substituicaoPecas.map ( ( item ) => ({
        _uid:     `${ item.codPeca }`,
        codPeca:  item.codPeca,
        nomePeca: nomesPecaMap [ item.codPeca ] ?? String ( item.codPeca ),
        qtdPeca:          item.qtdPeca,
        vlrUnitarioPeca:  item.vlrUnitarioPeca,
      }) ) );

      setCarregando ( false );
    }

    CarregarDados().catch ( ( err: Error ) => { setErro ( err.message ); setCarregando ( false ); } );
  }, [ os.numOdS ] );

  const HandleAdicionarServico = ( item: ServicoOdSLocal ) =>
  {
    setServicos ( ( anterior ) =>
      [ ...anterior.filter ( ( existente ) => existente.codServico !== item.codServico ), item ]
    );
  };

  const HandleRemoverServico = ( uid: string ) =>
  {
    setServicos ( ( anterior ) => anterior.filter ( ( item ) => item._uid !== uid ) );
  };

  const HandleAdicionarPecaSubstituida = ( item: SubstituirPecaOdSLocal ) =>
  {
    setSubstituicaoPecas ( ( anterior ) =>
      [ ...anterior.filter ( ( existente ) => existente.codPeca !== item.codPeca ), item ]
    );
  };

  const HandleRemoverPecaSubstituida = ( uid: string ) =>
  {
    setSubstituicaoPecas ( ( anterior ) => anterior.filter ( ( item ) => item._uid !== uid ) );
  };

  const CalcularValorTotal = ( item: ServicoOdSLocal ) =>
    ( Number ( item.valorUnitario ) * item.qtdServico ).toFixed ( 2 );

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );

    try
    {
      await ordensServicoService.registrarExecucao ( os.numOdS, {
        servicos: servicos.map ( ( item ) => ({
          codServico: item.codServico,
          qtdServico: item.qtdServico,
        }) ),
        obsTecnica: obsTecnica || null,
      } );

      await ordensServicoService.registrarSubstituicaoPecas ( os.numOdS, {
        pecas: substituicaoPecas.map ( ( item ) => ({
          codPeca:         item.codPeca,
          qtdPeca:         item.qtdPeca,
          vlrUnitarioPeca: item.vlrUnitarioPeca,
        }) ),
      } );

      onSalvo();
    }
    catch ( err )
    {
      if ( err instanceof ApiError )
      {
        setErro ( err.message );
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
      titulo={ `Execução da OS ${ os.numOdS }` }
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <div>
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Serviços executados</h4>
        <ServicoOdSForm onAdicionar={ HandleAdicionarServico } />
        {
          servicos.length > 0 && (
            <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '200px' } }>
              <Tabela>
                <thead>
                  <tr>
                    <th>Código do Serviço</th>
                    <th>Descrição</th>
                    <th>Quantidade</th>
                    <th>Valor Total</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    servicos.map ( ( item ) => (
                      <tr key={ item._uid }>
                        <td>{ item.codServico }</td>
                        <td>{ item.nomeServico }</td>
                        <td>{ item.qtdServico }</td>
                        <td>{ CalcularValorTotal ( item ) }</td>
                        <td>
                          <GrupoBotoes>
                            <Botao
                              type="button"
                              $variante="perigo"
                              onClick={ () => HandleRemoverServico ( item._uid ) }
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

      <div>
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Peças substituídas</h4>
        <SubstituirPecaOdSForm onAdicionar={ HandleAdicionarPecaSubstituida } />
        {
          substituicaoPecas.length > 0 && (
            <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '200px' } }>
              <Tabela>
                <thead>
                  <tr>
                    <th>Código da Peça</th>
                    <th>Peça</th>
                    <th>Quantidade</th>
                    <th>Valor Unitário</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    substituicaoPecas.map ( ( item ) => (
                      <tr key={ item._uid }>
                        <td>{ item.codPeca }</td>
                        <td>{ item.nomePeca }</td>
                        <td>{ item.qtdPeca }</td>
                        <td>{ item.vlrUnitarioPeca }</td>
                        <td>
                          <GrupoBotoes>
                            <Botao
                              type="button"
                              $variante="perigo"
                              onClick={ () => HandleRemoverPecaSubstituida ( item._uid ) }
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

      <FormSecao>
        <FormCampo label="Observações técnicas" colunas={ 12 } htmlFor="obsTecnica">
          <textarea
            id="obsTecnica"
            value={ obsTecnica }
            onChange={ ( evento ) => setObsTecnica ( evento.target.value ) }
            maxLength={ 244 }
          />
        </FormCampo>
      </FormSecao>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ salvando || carregando }>
          { salvando ? 'Salvando…' : 'Salvar execução' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
