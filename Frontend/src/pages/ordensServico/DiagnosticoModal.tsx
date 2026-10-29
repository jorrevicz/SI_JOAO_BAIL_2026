import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { ordensServicoService, type OrdemServico, type EquipamentoInput } from '../../services/ordensServico';
import { procedimentosService } from '../../services/procedimentos';
import { pecasService } from '../../services/pecas';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao, GrupoBotoes, TabelaWrapper, Tabela, ErroCampo } from './style';
import { OrcamentoPecaOdSForm, type OrcamentoPecaOdSLocal } from './OrcamentoPecaOdSForm';
import { InfoBlock } from '../compras/style';

interface ProcedimentoChecagemLocal
{
  codProcedimento:  number;
  nomeProcedimento: string;
  posicao:          string;
  checagem:         boolean;
  dthFim:           string;
  obsProcedimento:  string;
}

const FICHA_EQUIPAMENTO_VAZIA: EquipamentoInput = {
  equipamento:    '',
  grupoUser:      '',
  soEq:           '',
  socketEq:       '',
  memoriaRam:     '',
  tipoOffice:     '',
  placaMae:       '',
  bios:           '',
  capacidadeRam:  '',
  possuiSSD:      false,
  possuiHD:       false,
  capacidadeArmz: '',
  usoArmz:        '',
};

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
  const [ equipamento, setEquipamento ]       = useState < EquipamentoInput > ( FICHA_EQUIPAMENTO_VAZIA );
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

      if ( detalhe.equipamento )
      {
        setEquipamento ( {
          equipamento:    detalhe.equipamento.equipamento,
          grupoUser:      detalhe.equipamento.grupoUser ?? '',
          soEq:           detalhe.equipamento.soEq,
          socketEq:       detalhe.equipamento.socketEq,
          memoriaRam:     detalhe.equipamento.memoriaRam,
          tipoOffice:     detalhe.equipamento.tipoOffice,
          placaMae:       detalhe.equipamento.placaMae,
          bios:           detalhe.equipamento.bios,
          capacidadeRam:  detalhe.equipamento.capacidadeRam,
          possuiSSD:      detalhe.equipamento.possuiSSD,
          possuiHD:       detalhe.equipamento.possuiHD,
          capacidadeArmz: detalhe.equipamento.capacidadeArmz,
          usoArmz:        detalhe.equipamento.usoArmz,
        } );
      }

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

  const HandleAtualizarEquipamento = ( campo: Partial < EquipamentoInput > ) =>
  {
    setEquipamento ( ( anterior ) => ( { ...anterior, ...campo } ) );
  };

  // A ficha é opcional: sem nenhum campo preenchido ela não é enviada. Preenchida só em
  // parte, o Backend (Zod) rejeita e a mensagem aparece na seção.
  const fichaEquipamentoPreenchida = Object.values ( equipamento ).some ( ( valor ) =>
    typeof valor === 'boolean' ? valor : valor.trim() !== ''
  );

  const procedimentosPendentes = procedimentos.filter ( ( item ) =>
    !item.dthFim || ( !item.checagem && !item.obsProcedimento.trim() )
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
          posicao:         item.posicao || null,
          checagem:        item.checagem,
          dthFim:          item.dthFim,
          obsProcedimento: item.obsProcedimento || null,
        }) ),
        orcamentoPecas: orcamentoPecas.map ( ( item ) => ({
          codPeca: item.codPeca,
          vlrPv:   item.vlrPv,
        }) ),
        equipamento: fichaEquipamentoPreenchida
          ? { ...equipamento, grupoUser: equipamento.grupoUser || null }
          : null,
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
              Nenhum procedimento definido para esta OS — use o botão Procedimentos na listagem
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
                        <td>
                          <InfoBlock>
                            { item.nomeProcedimento }
                          </InfoBlock>
                        </td>
                        <td>
                          <input
                            type="datetime-local"
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
                        <td style={ { display: 'table-cell' } }>
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
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Equipamento</h4>
        <FormSecao>
          <FormCampo label="Equipamento" colunas={ 6 } htmlFor="equipamento">
            <input
              id="equipamento"
              value={ equipamento.equipamento }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { equipamento: evento.target.value } ) }
              maxLength={ 80 }
            />
          </FormCampo>

          <FormCampo label="Grupo de usuários (rede)" colunas={ 6 } htmlFor="grupoUser">
            <input
              id="grupoUser"
              value={ equipamento.grupoUser ?? '' }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { grupoUser: evento.target.value } ) }
              maxLength={ 40 }
            />
          </FormCampo>

          <FormCampo label="Sistema operacional" colunas={ 3 } htmlFor="soEq">
            <input
              id="soEq"
              value={ equipamento.soEq }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { soEq: evento.target.value } ) }
              maxLength={ 8 }
            />
          </FormCampo>

          <FormCampo label="Socket" colunas={ 3 } htmlFor="socketEq">
            <input
              id="socketEq"
              value={ equipamento.socketEq }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { socketEq: evento.target.value } ) }
              maxLength={ 15 }
            />
          </FormCampo>

          <FormCampo label="Memória RAM" colunas={ 3 } htmlFor="memoriaRam">
            <input
              id="memoriaRam"
              value={ equipamento.memoriaRam }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { memoriaRam: evento.target.value } ) }
              maxLength={ 15 }
            />
          </FormCampo>

          <FormCampo label="Office" colunas={ 3 } htmlFor="tipoOffice">
            <input
              id="tipoOffice"
              value={ equipamento.tipoOffice }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { tipoOffice: evento.target.value } ) }
              maxLength={ 15 }
            />
          </FormCampo>

          <FormCampo label="Placa-mãe" colunas={ 4 } htmlFor="placaMae">
            <input
              id="placaMae"
              value={ equipamento.placaMae }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { placaMae: evento.target.value } ) }
              maxLength={ 20 }
            />
          </FormCampo>

          <FormCampo label="BIOS" colunas={ 4 } htmlFor="bios">
            <input
              id="bios"
              value={ equipamento.bios }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { bios: evento.target.value } ) }
              maxLength={ 15 }
            />
          </FormCampo>

          <FormCampo label="Capacidade de RAM" colunas={ 4 } htmlFor="capacidadeRam">
            <input
              id="capacidadeRam"
              value={ equipamento.capacidadeRam }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { capacidadeRam: evento.target.value } ) }
              maxLength={ 10 }
            />
          </FormCampo>

          <FormCampo label="Capacidade de armazenamento" colunas={ 4 } htmlFor="capacidadeArmz">
            <input
              id="capacidadeArmz"
              value={ equipamento.capacidadeArmz }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { capacidadeArmz: evento.target.value } ) }
              maxLength={ 8 }
            />
          </FormCampo>

          <FormCampo label="Uso de armazenamento" colunas={ 4 } htmlFor="usoArmz">
            <input
              id="usoArmz"
              value={ equipamento.usoArmz }
              onChange={ ( evento ) => HandleAtualizarEquipamento ( { usoArmz: evento.target.value } ) }
              maxLength={ 8 }
              placeholder="Ex.: 50%"
            />
          </FormCampo>

          <FormCampo label="Possui SSD" colunas={ 2 }>
            <CaixaSelecao
              value={ equipamento.possuiSSD }
              onChange={ ( novoValor ) => HandleAtualizarEquipamento ( { possuiSSD: novoValor } ) }
            />
          </FormCampo>

          <FormCampo label="Possui HD" colunas={ 2 }>
            <CaixaSelecao
              value={ equipamento.possuiHD }
              onChange={ ( novoValor ) => HandleAtualizarEquipamento ( { possuiHD: novoValor } ) }
            />
          </FormCampo>
        </FormSecao>
        { errosCampo.equipamento && <ErroCampo>{ errosCampo.equipamento }</ErroCampo> }
      </div>

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
