import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { ordensServicoService, type OrdemServico } from '../../services/ordensServico';
import { procedimentosService, type Procedimento } from '../../services/procedimentos';
import { ProcedimentoConsulta } from '../procedimentos/ProcedimentoConsulta';
import { FormModal, FormAcoes, Botao, GrupoBotoes, TabelaWrapper, Tabela, TrSelecionavel } from './style';

interface Props
{
  os:         OrdemServico;
  onSalvo:    () => void;
  onCancelar: () => void;
}

interface ProcedimentoListaLocal
{
  _uid:             string;
  codProcedimento:  number;
  nomeProcedimento: string;
}

export default function ProcedimentoModal ( { os, onSalvo, onCancelar }: Props )
{
  'use no memo';
  const [ itens, setItens ]                   = useState < ProcedimentoListaLocal[] > ( [] );
  const [ selecionadoUid, setSelecionadoUid ] = useState < string | null > ( null );
  const [ consultando, setConsultando ]       = useState ( false );
  const [ erro, setErro ]                     = useState ( '' );
  const [ salvando, setSalvando ]             = useState ( false );
  const [ carregando, setCarregando ]         = useState ( true );

  useEffect ( () =>
  {
    async function CarregarDados ()
    {
      const [ detalhe, catalogo ] = await Promise.all ( [
        ordensServicoService.obter ( os.numOdS ),
        procedimentosService.listar ( { limit: 100 } ),
      ] );

      const nomesMap: Record < number, string > = {};
      catalogo.forEach ( ( procedimento ) => { nomesMap [ procedimento.codProcedimento ] = procedimento.procedimento; } );

      setItens (
        [ ...detalhe.procedimentos ]
          .sort ( ( a, b ) => a.ordem - b.ordem )
          .map ( ( item ) => ( {
            _uid:             `${ item.codProcedimento }`,
            codProcedimento:  item.codProcedimento,
            nomeProcedimento: nomesMap [ item.codProcedimento ] ?? String ( item.codProcedimento ),
          } ) )
      );
      setCarregando ( false );
    }

    CarregarDados().catch ( ( err: Error ) => { setErro ( err.message ); setCarregando ( false ); } );
  }, [ os.numOdS ] );

  const HandleAdicionarVarios = ( procedimentos: Procedimento[] ) =>
  {
    setItens ( ( anterior ) =>
    {
      const existentes = new Set ( anterior.map ( ( item ) => item.codProcedimento ) );
      const novos = procedimentos
        .filter ( ( procedimento ) => !existentes.has ( procedimento.codProcedimento ) )
        .map ( ( procedimento ) => ( {
          _uid:             crypto.randomUUID(),
          codProcedimento:  procedimento.codProcedimento,
          nomeProcedimento: procedimento.procedimento,
        } ) );

      return [ ...anterior, ...novos ];
    } );
    setConsultando ( false );
  };

  const HandleRemoverSelecionado = () =>
  {
    if ( !selecionadoUid )
    {
      return;
    }
    setItens ( ( anterior ) => anterior.filter ( ( item ) => item._uid !== selecionadoUid ) );
    setSelecionadoUid ( null );
  };

  const HandleMoverSelecionado = ( direcao: -1 | 1 ) =>
  {
    if ( !selecionadoUid )
    {
      return;
    }

    setItens ( ( anterior ) =>
    {
      const indice = anterior.findIndex ( ( item ) => item._uid === selecionadoUid );
      const novoIndice = indice + direcao;

      if ( indice < 0 || novoIndice < 0 || novoIndice >= anterior.length )
      {
        return anterior;
      }

      const copia = [ ...anterior ];
      [ copia [ indice ], copia [ novoIndice ] ] = [ copia [ novoIndice ], copia [ indice ] ];
      return copia;
    } );
  };

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );

    try
    {
      const procedimentosOrdenados = itens.map ( ( item, indice ) => ( { codProcedimento: item.codProcedimento, ordem: indice + 1 } ) );
      await ordensServicoService.definirProcedimentos ( os.numOdS, { procedimentos: procedimentosOrdenados } );
      onSalvo();
    }
    catch ( err )
    {
      setErro ( err instanceof ApiError ? err.message : ( err as Error ).message );
    }
    finally
    {
      setSalvando ( false );
    }
  };

  const indiceSelecionado = itens.findIndex ( ( item ) => item._uid === selecionadoUid );

  return (
    <>
      <FormModal
        titulo={ `Procedimentos da OS ${ os.numOdS }` }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <div>
          <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Checklist de procedimentos</h4>
          <GrupoBotoes>
            <Botao type="button" $variante="secundario" onClick={ () => setConsultando ( true ) }>
              Adicionar procedimento
            </Botao>
            <Botao
              type="button"
              $variante="secundario"
              disabled={ !selecionadoUid || indiceSelecionado <= 0 }
              onClick={ () => HandleMoverSelecionado ( -1 ) }
            >
              ▲ Mover para cima
            </Botao>
            <Botao
              type="button"
              $variante="secundario"
              disabled={ !selecionadoUid || indiceSelecionado === -1 || indiceSelecionado >= itens.length - 1 }
              onClick={ () => HandleMoverSelecionado ( 1 ) }
            >
              ▼ Mover para baixo
            </Botao>
            <Botao
              type="button"
              $variante="perigo"
              disabled={ !selecionadoUid }
              onClick={ HandleRemoverSelecionado }
            >
              Remover selecionado
            </Botao>
          </GrupoBotoes>

          {
            !carregando && itens.length === 0 && (
              <p style={ { fontSize: '0.875rem', marginTop: '0.75rem' } }>
                Nenhum procedimento na checklist — adicione ao menos um antes de registrar o diagnóstico.
              </p>
            )
          }

          {
            itens.length > 0 && (
              <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '320px' } }>
                <Tabela>
                  <thead>
                    <tr>
                      <th>Ordem</th>
                      <th>Procedimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      itens.map ( ( item, indice ) => (
                        <TrSelecionavel
                          key={ item._uid }
                          onClick={ () => setSelecionadoUid ( ( atual ) => ( atual === item._uid ? null : item._uid ) ) }
                          $selecionado={ selecionadoUid === item._uid }
                        >
                          <td>{ indice + 1 }</td>
                          <td>{ item.nomeProcedimento }</td>
                        </TrSelecionavel>
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
            { salvando ? 'Salvando…' : 'Salvar procedimentos' }
          </Botao>
        </FormAcoes>
      </FormModal>

      { consultando && (
        <ProcedimentoConsulta
          onSelecionarVarios={ HandleAdicionarVarios }
          onCancelar={ () => setConsultando ( false ) }
        />
      ) }
    </>
  );
}
