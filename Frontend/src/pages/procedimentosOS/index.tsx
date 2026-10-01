import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiError } from '../../services/api';
import { ordensServicoService } from '../../services/ordensServico';
import { procedimentosService, type Procedimento } from '../../services/procedimentos';
import { ProcedimentoConsulta } from '../procedimentos/ProcedimentoConsulta';
import
{
  Toolbar, Botao, GrupoBotoes, TabelaWrapper, Tabela, TrSelecionavel, Alerta,
  Breadcrumb, BreadcrumbLink,
} from './style';

interface ProcedimentoListaLocal
{
  _uid:             string;
  codProcedimento:  number;
  nomeProcedimento: string;
}

export default function ProcedimentosOSPage ()
{
  'use no memo';
  const [ searchParams ] = useSearchParams();
  const numOdS = Number ( searchParams.get ( 'numOdS' ) ) || 0;

  const [ itens, setItens ]                   = useState < ProcedimentoListaLocal[] > ( [] );
  const [ selecionadoUid, setSelecionadoUid ] = useState < string | null > ( null );
  const [ consultando, setConsultando ]       = useState ( false );
  const [ erro, setErro ]                     = useState ( '' );
  const [ salvando, setSalvando ]             = useState ( false );
  const [ carregando, setCarregando ]         = useState ( !!numOdS );

  useEffect ( () =>
  {
    if ( !numOdS )
    {
      return;
    }

    async function Carregar ()
    {
      const [ detalhe, catalogo ] = await Promise.all ( [
        ordensServicoService.obter ( numOdS ),
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

    Carregar().catch ( ( err: Error ) => { setErro ( err.message ); setCarregando ( false ); } );
  }, [ numOdS ] );

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

  const HandleSalvar = async () =>
  {
    setSalvando ( true );
    setErro ( '' );

    try
    {
      const procedimentosOrdenados = itens.map ( ( item, indice ) => ( { codProcedimento: item.codProcedimento, ordem: indice + 1 } ) );
      await ordensServicoService.definirProcedimentos ( numOdS, { procedimentos: procedimentosOrdenados } );
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

  if ( !numOdS )
  {
    return (
      <section>
        <Alerta role="alert">Informe a Ordem de Serviço (numOdS) na URL para gerenciar seus procedimentos.</Alerta>
      </section>
    );
  }

  return (
    <section>
      <Breadcrumb>
        <BreadcrumbLink to="/ordens-servico">Ordens de Serviço</BreadcrumbLink>
        <span>/</span>
        <span>OS { numOdS }</span>
        <span>/</span>
        <span>Procedimentos</span>
      </Breadcrumb>

      <Toolbar>
        <h2>Procedimentos da OS { numOdS }</h2>
        <Botao onClick={ HandleSalvar } disabled={ salvando || carregando }>
          { salvando ? 'Salvando…' : 'Salvar alterações' }
        </Botao>
      </Toolbar>

      <Toolbar>
        <GrupoBotoes>
          <Botao $variante="secundario" onClick={ () => setConsultando ( true ) }>
            Adicionar procedimento
          </Botao>
          <Botao
            $variante="secundario"
            disabled={ !selecionadoUid || indiceSelecionado <= 0 }
            onClick={ () => HandleMoverSelecionado ( -1 ) }
          >
            ▲ Mover para cima
          </Botao>
          <Botao
            $variante="secundario"
            disabled={ !selecionadoUid || indiceSelecionado === -1 || indiceSelecionado >= itens.length - 1 }
            onClick={ () => HandleMoverSelecionado ( 1 ) }
          >
            ▼ Mover para baixo
          </Botao>
          <Botao
            $variante="perigo"
            disabled={ !selecionadoUid }
            onClick={ HandleRemoverSelecionado }
          >
            Remover selecionado
          </Botao>
        </GrupoBotoes>
      </Toolbar>

      { erro && <Alerta role="alert">{ erro }</Alerta> }

      { !carregando && itens.length === 0 && (
        <Alerta role="alert">
          Nenhum procedimento na checklist — adicione ao menos um antes de registrar o diagnóstico.
        </Alerta>
      ) }

      <TabelaWrapper>
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
              ) )
            }
          </tbody>
        </Tabela>
      </TabelaWrapper>

      { consultando && (
        <ProcedimentoConsulta
          onSelecionarVarios={ HandleAdicionarVarios }
          onCancelar={ () => setConsultando ( false ) }
        />
      ) }
    </section>
  );
}
