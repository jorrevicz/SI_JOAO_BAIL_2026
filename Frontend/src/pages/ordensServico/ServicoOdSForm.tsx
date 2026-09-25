import { useState } from 'react';
import { type ServicoOdSInput } from '../../services/ordensServico';
import { type Funcionario } from '../../services/funcionarios';
import { TecnicoConsulta } from '../funcionarios/TecnicoConsulta';
import { FormSecao, FormCampo, Botao } from './style';

export interface ServicoOdSLocal extends ServicoOdSInput
{
  _uid:            string;
  nomeServico:     string;
  valorUnitario:   string;
  codFuncionario:  number;
  nomeFuncionario: string;
}

interface Props
{
  onAdicionar: ( item: ServicoOdSLocal ) => void;
}

export function ServicoOdSForm ( { onAdicionar }: Props )
{
  const [ codServico, setCodServico ]     = useState ( 0 );
  const [ nomeServico, setNomeServico ]   = useState ( '' );
  const [ valorUnitario, setValorUnitario ] = useState ( '' );
  const [ codFuncionario, setCodFuncionario ] = useState ( 0 );
  const [ nomeFuncionario, setNomeFuncionario ] = useState ( '' );
  const [ qtdServico, setQtdServico ]     = useState ( 1 );
  const [ consultandoTecnico, setConsultandoTecnico ] = useState ( false );
  const [ erroServico, setErroServico ]   = useState ( '' );
  const [ erroDescricao, setErroDescricao ] = useState ( '' );
  const [ erroQuantidade, setErroQuantidade ] = useState ( '' );
  const [ erroFuncionario, setErroFuncionario ] = useState ( '' );

  const HandleSelecionarTecnico = ( oFuncionario: Funcionario ) =>
  {
    setCodFuncionario ( oFuncionario.codFuncionario );
    setNomeFuncionario ( oFuncionario.funcionario );
    setErroFuncionario ( '' );
    setConsultandoTecnico ( false );
  };

  const HandleAdicionar = () =>
  {
    let valido = true;

    if ( !codServico )
    {
      setErroServico ( 'Informe o código do serviço.' );
      valido = false;
    }
    else
    {
      setErroServico ( '' );
    }

    if ( !nomeServico.trim() )
    {
      setErroDescricao ( 'Informe a descrição do serviço.' );
      valido = false;
    }
    else
    {
      setErroDescricao ( '' );
    }

    if ( !qtdServico || qtdServico <= 0 )
    {
      setErroQuantidade ( 'A quantidade deve ser maior que zero.' );
      valido = false;
    }
    else
    {
      setErroQuantidade ( '' );
    }

    if ( !codFuncionario )
    {
      setErroFuncionario ( 'Informe o código do técnico.' );
      valido = false;
    }
    else
    {
      setErroFuncionario ( '' );
    }

    if ( !valido )
    {
      return;
    }

    onAdicionar({
      _uid:          crypto.randomUUID(),
      codServico,
      nomeServico,
      valorUnitario: Number ( valorUnitario || 0 ).toFixed ( 2 ),
      codFuncionario,
      nomeFuncionario,
      qtdServico,
    });

    setCodServico ( 0 );
    setNomeServico ( '' );
    setValorUnitario ( '' );
    setCodFuncionario ( 0 );
    setNomeFuncionario ( '' );
    setQtdServico ( 1 );
  };

  return (
    <>
      <FormSecao>
        <FormCampo label="Código do Serviço" obrigatorio colunas={ 2 } htmlFor="codServico" erro={ erroServico }>
          <input
            id="codServico"
            type="number"
            min={ 1 }
            step={ 1 }
            value={ codServico || '' }
            onChange={ ( evento ) => setCodServico ( Number ( evento.target.value ) ) }
          />
        </FormCampo>

        <FormCampo label="Descrição" obrigatorio colunas={ 5 } htmlFor="nomeServico" erro={ erroDescricao }>
          <input
            id="nomeServico"
            value={ nomeServico }
            onChange={ ( evento ) => setNomeServico ( evento.target.value ) }
            maxLength={ 80 }
          />
        </FormCampo>

        <FormCampo label="Quantidade" obrigatorio colunas={ 2 } htmlFor="qtdServico" erro={ erroQuantidade }>
          <input
            id="qtdServico"
            type="number"
            min={ 1 }
            step={ 1 }
            value={ qtdServico }
            onChange={ ( evento ) => setQtdServico ( Number ( evento.target.value ) ) }
          />
        </FormCampo>

        <FormCampo label="Valor Unitário" colunas={ 3 } htmlFor="valorUnitario">
          <input
            id="valorUnitario"
            value={ valorUnitario }
            onChange={ ( evento ) => setValorUnitario ( evento.target.value ) }
            placeholder="150.00"
          />
        </FormCampo>
      </FormSecao>

      <FormSecao>
        <FormCampo label="Técnico" obrigatorio colunas={ 3 } erro={ erroFuncionario }>
          <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
            <Botao
              type="button"
              $variante="secundario"
              onClick={ () => setConsultandoTecnico ( true ) }
            >
              Consultar
            </Botao>
          </div>
        </FormCampo>

        <FormCampo label="Código do Técnico" colunas={ 2 }>
          <input
            disabled
            readOnly
            value={ codFuncionario || '' }
          />
        </FormCampo>

        <FormCampo label="Nome do Técnico" colunas={ 4 }>
          <input
            disabled
            readOnly
            value={ nomeFuncionario }
          />
        </FormCampo>

        <FormCampo colunas={ 3 }>
          <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
            <Botao type="button" onClick={ HandleAdicionar }>
              Adicionar
            </Botao>
          </div>
        </FormCampo>
      </FormSecao>

      {
        consultandoTecnico && (
          <TecnicoConsulta
            onSelecionar={ HandleSelecionarTecnico }
            onCancelar={ () => setConsultandoTecnico ( false ) }
          />
        )
      }
    </>
  );
}
