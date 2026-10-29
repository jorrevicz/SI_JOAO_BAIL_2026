import { useState } from 'react';
import { type ServicoOdSInput } from '../../services/ordensServico';
import { funcionariosService } from '../../services/funcionarios';
import { cargosService } from '../../services/cargos';
import { TecnicoConsulta, NomeCargoNormalizado } from '../funcionarios/TecnicoConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { FormSecao, FormCampo, Botao } from './style';
import { validarDecimal } from '../../utils/validators';

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
  const [ erroValor, setErroValor ]         = useState ( '' );
  const campoTecnico = useCampoConsulta (
    {
      codigoInicial: null,
      // Digitado à mão, o código precisa ser de um funcionário com cargo Técnico, como na consulta
      buscar:        async ( codigo ) =>
      {
        const funcionario = await funcionariosService.obter ( codigo );
        const cargo       = await cargosService.obter ( funcionario.codCargo );

        if ( NomeCargoNormalizado ( cargo.cargo ) !== 'tecnico' )
        {
          throw new Error ( `O funcionário ${ codigo } não é um Técnico.` );
        }

        return funcionario;
      },
      codigoDe:      ( funcionario ) => funcionario.codFuncionario,
      descricaoDe:   ( funcionario ) => funcionario.funcionario,
    }
  );
  const [ qtdServico, setQtdServico ]     = useState ( 1 );
  const [ erroServico, setErroServico ]   = useState ( '' );
  const [ erroDescricao, setErroDescricao ] = useState ( '' );
  const [ erroQuantidade, setErroQuantidade ] = useState ( '' );
  const [ erroFuncionario, setErroFuncionario ] = useState ( '' );

  const HandleAdicionar = async () =>
  {
    let valido = true;

    // Confere no banco o código do técnico digitado à mão antes de incluir o serviço na lista
    const tecnicoEncontrado = await campoTecnico.resolver();

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

    if ( !campoTecnico.codigo )
    {
      setErroFuncionario ( 'Informe o código do técnico.' );
      valido = false;
    }
    else
    {
      setErroFuncionario ( '' );

      if ( !tecnicoEncontrado )
      {
        valido = false;
      }
    }

    if ( !valido || !tecnicoEncontrado )
    {
      return;
    }

    onAdicionar({
      _uid:          crypto.randomUUID(),
      codServico,
      nomeServico,
      valorUnitario: Number ( valorUnitario || 0 ).toFixed ( 2 ),
      codFuncionario:  tecnicoEncontrado.codFuncionario,
      nomeFuncionario: tecnicoEncontrado.funcionario,
      qtdServico,
    });

    setCodServico ( 0 );
    setNomeServico ( '' );
    setValorUnitario ( '' );
    campoTecnico.digitar ( '' );
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

        <FormCampo label="Valor Unitário" colunas={ 3 } htmlFor="valorUnitario" erro={ erroValor }>
          <input
            id="valorUnitario"
            value={ valorUnitario }
            onChange={ ( evento ) =>
            {
              setValorUnitario ( evento.target.value );
              setErroValor ( validarDecimal ( evento.target.value, 2, 'O valor unitário' ) );
            } }
            placeholder="150.00"
          />
        </FormCampo>
      </FormSecao>

      <FormSecao>
        <CampoConsulta
          campo={ campoTecnico }
          Consulta={ TecnicoConsulta }
          rotulo="Técnico"
          rotuloCodigo="Código do Técnico"
          rotuloNome="Nome do Técnico"
          obrigatorio
          erroApi={ erroFuncionario }
          colunas={ [ 3, 2, 4 ] }
        />

        <FormCampo colunas={ 3 }>
          <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
            <Botao type="button" onClick={ () => { void HandleAdicionar(); } }>
              Adicionar
            </Botao>
          </div>
        </FormCampo>
      </FormSecao>
    </>
  );
}
