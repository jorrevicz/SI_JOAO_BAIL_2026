import { useState } from 'react';
import { ApiError } from '../../services/api';
import { ordensServicoService, type AbrirOrdemServicoInput } from '../../services/ordensServico';
import { clientesService } from '../../services/clientes';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { ClienteConsulta } from '../clientes/ClienteConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';

interface Props
{
  onSalvo:    () => void;
  onCancelar: () => void;
}

const FORM_VAZIO: AbrirOrdemServicoInput = {
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
};

export default function OrdemServicoForm ( { onSalvo, onCancelar }: Props )
{
  const [ form, setForm ]       = useState < AbrirOrdemServicoInput > ( FORM_VAZIO );
  const campoCliente      = useCampoConsulta (
    {
      codigoInicial: null,
      buscar:        clientesService.obter,
      codigoDe:      ( cliente ) => cliente.codCliente,
      descricaoDe:   ( cliente ) => cliente.cliente,
    }
  );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false ); 

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    if ( !( await campoCliente.validar() ) )
    {
      setSalvando ( false );
      return;
    }

    try
    {
      await ordensServicoService.abrir ( { ...form, codCliente: campoCliente.codigo } );
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

  // O cliente informado libera a edição dos demais campos (o número da OS é
  // gerado pelo banco na abertura — não há mais chave a validar antes de
  // preencher o restante do formulário). A existência do código é conferida ao salvar.
  const clienteSelecionado = campoCliente.codigo > 0;
  const podeSalvar         = !salvando && clienteSelecionado;

  return (
    <FormModal
      titulo="Abrir Ordem de Serviço"
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    > 
      <FormSecao>
        <CampoConsulta
          campo={ campoCliente }
          Consulta={ ClienteConsulta }
          rotulo="Clientes"
          rotuloCodigo="Código do cliente"
          rotuloNome="Cliente"
          obrigatorio
          erroApi={ errosCampo.codCliente }
          colunas={ [ 2, 1, 5 ] }
        />
      </FormSecao>

      <FormSecao>
        <FormCampo label='Fone' colunas={ 1.8 }>
          <div>
            {
              (
                <span style={ { fontSize: '0.875rem' } }>
                  <input 
                    disabled={ true }
                    readOnly={ true }
                    value={ campoCliente.entidade?.foneCl ?? '' }
                  />
                </span>
              )
            }
          </div>
        </FormCampo>

        <FormCampo label='Endereço' colunas={ 6 }>
          <div>
            {
              (
                <span style={ { fontSize: '0.875rem' } }>
                  <input 
                    disabled={ true }
                    readOnly={ true }
                    value={ campoCliente.entidade?.enderecoCl ?? '' }
                  />
                </span>
              )
            }
          </div>
        </FormCampo>
      </FormSecao>  

      <FormSecao>
        <FormCampo label="Atendente" obrigatorio colunas={ 4 } htmlFor="atendente" erro={ errosCampo.atendente }>
          <input
            id="atendente"
            value={ form.atendente }
            onChange={ ( evento ) => setForm ( { ...form, atendente: evento.target.value } ) }
            maxLength={ 128 }
            required
          />
        </FormCampo>

        <FormCampo label="Solicitante" colunas={ 4 } htmlFor="solicitante" erro={ errosCampo.solicitante }>
          <input
            id="solicitante"
            value={ form.solicitante ?? '' }
            onChange={ ( evento ) => setForm ( { ...form, solicitante: evento.target.value } ) }
            maxLength={ 128 }
          />
        </FormCampo>
      </FormSecao>

      <FormSecao>
        <FormCampo label="Tipo da OS" obrigatorio colunas={ 4 } htmlFor="tipoOdS" erro={ errosCampo.tipoOdS }>
          <input
            id="tipoOdS"
            value={ form.tipoOdS }
            onChange={ ( evento ) => setForm ( { ...form, tipoOdS: evento.target.value } ) }
            maxLength={ 14 }
            placeholder="Ex.: Garantia"
            disabled={ !clienteSelecionado }
            required
          />
          </FormCampo>
      </FormSecao>


      <fieldset disabled={ !clienteSelecionado } style={ { border: 'none', padding: 0, margin: 0 } }>
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

      </fieldset>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ !podeSalvar }>
          { salvando ? 'Salvando…' : 'Abrir OS' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
