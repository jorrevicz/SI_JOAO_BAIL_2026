import { useState } from 'react';
import { ApiError } from '../../services/api';
import { ordensServicoService, type AbrirOrdemServicoInput } from '../../services/ordensServico';
import { type Cliente } from '../../services/clientes';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { ClienteConsulta } from '../clientes/ClienteConsulta';

interface Props
{
  onSalvo:    () => void;
  onCancelar: () => void;
}

const FORM_VAZIO: AbrirOrdemServicoInput = {
  numOdS:      '',
  codCliente:  0,
  atendente:   '',
  acessorio:   '',
  defeito:     '',
  obsBalcao:   '',
  tipoOdS:     '',
  solicitante: '',
  aparelho: {
    aparelho: '',
    serie:    '',
    modelo:   '',
    voltagem: '',
    garantia: '',
  },
  equipamento: {
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
  },
};

export default function OrdemServicoForm ( { onSalvo, onCancelar }: Props )
{
  const [ form, setForm ]       = useState < AbrirOrdemServicoInput > ( FORM_VAZIO );
  const [ codClienteSelecionado, setCodClienteSelecionado] = useState ( 0 );
  const [ nomeClienteSelecionado, setNomeClienteSelecionado ] = useState ( '' );
  const [ foneClienteSelecionado, setFoneClienteSlecionado ] = useState ( '' );
  const [ enderecoClienteSelecionado, setEnderecoClienteSelecionado ] = useState ( '' );
  const [ consultandoCliente, setConsultandoCliente ] = useState ( false );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false ); 

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      await ordensServicoService.abrir ( form );
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

  const HandleSelecionarCliente = ( oCliente: Cliente ) =>
  {
    setForm ( { ...form, codCliente: oCliente.codCliente } );
    setCodClienteSelecionado ( oCliente.codCliente );
    setNomeClienteSelecionado ( oCliente.cliente );
    setFoneClienteSlecionado ( oCliente.foneCl ?? '' );
    setEnderecoClienteSelecionado ( oCliente.enderecoCl ?? '' );
    setConsultandoCliente ( false );
  };

  const podeSalvar = !salvando && !!form.numOdS && !!form.codCliente;

  return (
    <FormModal
      titulo="Abrir Ordem de Serviço"
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Número da OS" obrigatorio colunas={ 3 } htmlFor="numOdS" erro={ errosCampo.numOdS }>
          <input
            id="numOdS"
            value={ form.numOdS }
            onChange={ ( evento ) => setForm ( { ...form, numOdS: evento.target.value.toUpperCase() } ) }
            maxLength={ 8 }
            required
            autoFocus
          />
        </FormCampo> 

        <FormCampo label="Tipo da OS" obrigatorio colunas={ 4 } htmlFor="tipoOdS" erro={ errosCampo.tipoOdS }>
          <input
            id="tipoOdS"
            value={ form.tipoOdS }
            onChange={ ( evento ) => setForm ( { ...form, tipoOdS: evento.target.value } ) }
            maxLength={ 14 }
            placeholder="Ex.: Garantia"
            required
          />
        </FormCampo>
      </FormSecao>

      <FormSecao>
        <FormCampo label="Clientes" obrigatorio colunas={ 2 } erro={ errosCampo.codCliente }>
          <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
            <Botao
              type="button"
              $variante="secundario"
              onClick={ () => setConsultandoCliente ( true ) }
            >
              Consultar
            </Botao> 
          </div>
        </FormCampo>

        <FormCampo label='Código do cliente' colunas={ 2 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input
                      disabled={ true }
                      readOnly={ true }
                      value={ codClienteSelecionado }
                    />
                  </span>
                )
              }
            </div>
        </FormCampo>


        <FormCampo label='Cliente' colunas={ 5 }>
            <div>
              {
                (
                  <span style={ { fontSize: '0.875rem' } }>
                    <input
                      disabled={ true }
                      readOnly={ true }
                      value={ nomeClienteSelecionado }
                    />
                  </span>
                )
              }
            </div>
        </FormCampo>

        <FormCampo label='Fone' colunas={ 4 }>
          <div>
            {
              (
                <span style={ { fontSize: '0.875rem' } }>
                  <input 
                    disabled={ true }
                    readOnly={ true }
                    value={ foneClienteSelecionado }
                  />
                </span>
              )
            }
          </div>
        </FormCampo>

        <FormCampo label='Endereço' colunas={ 4 }>
          <div>
            {
              (
                <span style={ { fontSize: '0.875rem' } }>
                  <input 
                    disabled={ true }
                    readOnly={ true }
                    value={ enderecoClienteSelecionado }
                  />
                </span>
              )
            }
          </div>
        </FormCampo>
      </FormSecao>  

      <div>
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Aparelho</h4>
        <FormSecao>
          <FormCampo label="Nome do aparelho" colunas={ 4 } htmlFor="aparelho">
            <input
              id="aparelho"
              value={ form.aparelho.aparelho ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, aparelho: { ...form.aparelho, aparelho: evento.target.value } } ) }
              maxLength={ 80 }
              placeholder="Ex.: Notebook"
            />
          </FormCampo>

          <FormCampo label="Série" colunas={ 4 } htmlFor="serie">
            <input
              id="serie"
              value={ form.aparelho.serie ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, aparelho: { ...form.aparelho, serie: evento.target.value } } ) }
              maxLength={ 25 }
            />
          </FormCampo>

          <FormCampo label="Modelo" obrigatorio colunas={ 4 } htmlFor="modelo">
            <input
              id="modelo"
              value={ form.aparelho.modelo }
              onChange={ ( evento ) => setForm ( { ...form, aparelho: { ...form.aparelho, modelo: evento.target.value } } ) }
              maxLength={ 50 }
              required
            />
          </FormCampo>

          <FormCampo label="Voltagem" obrigatorio colunas={ 4 } htmlFor="voltagem">
            <input
              id="voltagem"
              value={ form.aparelho.voltagem }
              onChange={ ( evento ) => setForm ( { ...form, aparelho: { ...form.aparelho, voltagem: evento.target.value } } ) }
              maxLength={ 6 }
              placeholder="Ex.: Bivolt"
              required
            />
          </FormCampo>

          <FormCampo label="Garantia" obrigatorio colunas={ 4 } htmlFor="garantia">
            <input
              id="garantia"
              value={ form.aparelho.garantia }
              onChange={ ( evento ) => setForm ( { ...form, aparelho: { ...form.aparelho, garantia: evento.target.value } } ) }
              maxLength={ 20 }
              placeholder="Ex.: 12 meses"
              required
            />
          </FormCampo>
        </FormSecao>
      </div>

      <FormSecao>    
        <FormCampo label="Atendente" obrigatorio colunas={ 5 } htmlFor="atendente" erro={ errosCampo.atendente }>
          <input
            id="atendente"
            value={ form.atendente }
            onChange={ ( evento ) => setForm ( { ...form, atendente: evento.target.value } ) }
            maxLength={ 128 }
            required
          />
        </FormCampo>
        </FormSecao>

        <FormSecao>
        <FormCampo label="Solicitante" colunas={ 5 } htmlFor="solicitante" erro={ errosCampo.solicitante }>
          <input
            id="solicitante"
            value={ form.solicitante ?? '' }
            onChange={ ( evento ) => setForm ( { ...form, solicitante: evento.target.value } ) }
            maxLength={ 128 }
          />
        </FormCampo>

        <FormCampo label="Acessório" colunas={ 8 } htmlFor="acessorio" erro={ errosCampo.acessorio }>
          <input
            id="acessorio"
            value={ form.acessorio ?? '' }
            onChange={ ( evento ) => setForm ( { ...form, acessorio: evento.target.value } ) }
            maxLength={ 80 }
          />
        </FormCampo>

        <FormCampo label="Defeito relatado" obrigatorio colunas={ 8 } htmlFor="defeito" erro={ errosCampo.defeito }>
          <input
            id="defeito"
            value={ form.defeito }
            onChange={ ( evento ) => setForm ( { ...form, defeito: evento.target.value } ) }
            maxLength={ 80 }
            required
          />
        </FormCampo>

        <FormCampo label="Observações de balcão" colunas={ 12 } htmlFor="obsBalcao" erro={ errosCampo.obsBalcao }>
          <textarea
            id="obsBalcao"
            value={ form.obsBalcao ?? '' }
            onChange={ ( evento ) => setForm ( { ...form, obsBalcao: evento.target.value } ) }
            maxLength={ 244 }
          />
        </FormCampo>
      </FormSecao> 

      <div>
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Equipamento</h4>
        <FormSecao>
          <FormCampo label="Equipamento" obrigatorio colunas={ 6 } htmlFor="equipamento">
            <input
              id="equipamento"
              value={ form.equipamento.equipamento }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, equipamento: evento.target.value } } ) }
              maxLength={ 80 }
              required
            />
          </FormCampo>

          <FormCampo label="Grupo de usuários (rede)" colunas={ 6 } htmlFor="grupoUser">
            <input
              id="grupoUser"
              value={ form.equipamento.grupoUser ?? '' }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, grupoUser: evento.target.value } } ) }
              maxLength={ 40 }
            />
          </FormCampo>

          <FormCampo label="Sistema operacional" obrigatorio colunas={ 3 } htmlFor="soEq">
            <input
              id="soEq"
              value={ form.equipamento.soEq }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, soEq: evento.target.value } } ) }
              maxLength={ 8 }
              required
            />
          </FormCampo>

          <FormCampo label="Socket" obrigatorio colunas={ 3 } htmlFor="socketEq">
            <input
              id="socketEq"
              value={ form.equipamento.socketEq }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, socketEq: evento.target.value } } ) }
              maxLength={ 15 }
              required
            />
          </FormCampo>

          <FormCampo label="Memória RAM" obrigatorio colunas={ 3 } htmlFor="memoriaRam">
            <input
              id="memoriaRam"
              value={ form.equipamento.memoriaRam }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, memoriaRam: evento.target.value } } ) }
              maxLength={ 15 }
              required
            />
          </FormCampo>

          <FormCampo label="Office" obrigatorio colunas={ 3 } htmlFor="tipoOffice">
            <input
              id="tipoOffice"
              value={ form.equipamento.tipoOffice }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, tipoOffice: evento.target.value } } ) }
              maxLength={ 15 }
              required
            />
          </FormCampo>

          <FormCampo label="Placa-mãe" obrigatorio colunas={ 4 } htmlFor="placaMae">
            <input
              id="placaMae"
              value={ form.equipamento.placaMae }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, placaMae: evento.target.value } } ) }
              maxLength={ 20 }
              required
            />
          </FormCampo>

          <FormCampo label="BIOS" obrigatorio colunas={ 4 } htmlFor="bios">
            <input
              id="bios"
              value={ form.equipamento.bios }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, bios: evento.target.value } } ) }
              maxLength={ 15 }
              required
            />
          </FormCampo>

          <FormCampo label="Capacidade de RAM" obrigatorio colunas={ 4 } htmlFor="capacidadeRam">
            <input
              id="capacidadeRam"
              value={ form.equipamento.capacidadeRam }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, capacidadeRam: evento.target.value } } ) }
              maxLength={ 10 }
              required
            />
          </FormCampo>

          <FormCampo label="Capacidade de armazenamento" obrigatorio colunas={ 4 } htmlFor="capacidadeArmz">
            <input
              id="capacidadeArmz"
              value={ form.equipamento.capacidadeArmz }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, capacidadeArmz: evento.target.value } } ) }
              maxLength={ 8 }
              required
            />
          </FormCampo>

          <FormCampo label="Uso de armazenamento" obrigatorio colunas={ 4 } htmlFor="usoArmz">
            <input
              id="usoArmz"
              value={ form.equipamento.usoArmz }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, usoArmz: evento.target.value } } ) }
              maxLength={ 8 }
              placeholder="Ex.: 50%"
              required
            />
          </FormCampo>

          <FormCampo label="Possui SSD" colunas={ 2 }>
            <CaixaSelecao
              value={ form.equipamento.possuiSSD }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, possuiSSD: evento } } ) }
            />
          </FormCampo>

          <FormCampo label="Possui HD" colunas={ 2 }>
            <CaixaSelecao
              value={ form.equipamento.possuiHD }
              onChange={ ( evento ) => setForm ( { ...form, equipamento: { ...form.equipamento, possuiHD: evento } } ) }
            />
          </FormCampo>
        </FormSecao>
      </div>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ !podeSalvar }>
          { salvando ? 'Salvando…' : 'Abrir OS' }
        </Botao>
      </FormAcoes>

      {
        consultandoCliente && (
          <ClienteConsulta
            onSelecionar={ HandleSelecionarCliente }
            onCancelar={ () => setConsultandoCliente ( false ) }
          />
        )
      }
    </FormModal>
  );
}
