import { useState } from 'react';
import { ApiError } from '../../services/api';
import { estadosService, type Estado, type CreateEstadoInput } from '../../services/estados';
import { paisesService } from '../../services/paises';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { PaisConsulta } from '../paises/PaisConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { comErroDoCampo, validarLetrasComTamanho } from '../../utils/validators';

interface Props
{
  inicial: Partial < Estado >;
  onSalvo: ( salvo: Estado ) => void;
  onCancelar: () => void;
}

export function EstadoForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateEstadoInput > ( {
    codPais: inicial.codPais ?? 0,
    uf:      inicial.uf      ?? '',
    estado:  inicial.estado  ?? '',
    isActive: inicial.isActive ?? true,
  } );
  const campoPais = useCampoConsulta (
    {
      codigoInicial: inicial.codPais,
      buscar:        paisesService.obter,
      codigoDe:      ( pais ) => pais.codPais,
      descricaoDe:   ( pais ) => pais.pais,
    }
  );

  const [ erro, setErro ] = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ] = useState ( false );

  const editando = !!inicial.codEstado;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    if ( !( await campoPais.validar() ) )
    {
      setSalvando ( false );
      return;
    }

    const dados: CreateEstadoInput = { ...form, codPais: campoPais.codigo };

    try
    {
      if ( editando )
      {
        onSalvo ( await estadosService.atualizar ( inicial.codEstado!, dados ) );
      }
      else
      {
        onSalvo ( await estadosService.criar ( dados ) );
      }
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
    <>
      <FormModal
        titulo={ editando ? 'Editar estado' : 'Novo estado' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao> 
          <FormCampo label="Nome do estado" obrigatorio colunas={ 4 } htmlFor="estado" erro={ errosCampo.estado }>
            <input
              id="estado"
              value={ form.estado }
              onChange={ ( evento ) => setForm ( { ...form, estado: evento.target.value.toLocaleUpperCase() } ) }
              maxLength={ 22 }
              required
            />
          </FormCampo>

          <FormCampo label="UF" obrigatorio colunas={ 1 } htmlFor="uf" erro={ errosCampo.uf }>
            <input
              id="uf"
              value={ form.uf }
              onChange={ ( evento ) =>
              {
                setForm ( { ...form, uf: evento.target.value.toUpperCase() } );
                setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'uf', validarLetrasComTamanho ( evento.target.value, [ 2 ], 'A UF' ) ) );
              } }
              maxLength={ 2 }
              required
              autoFocus
              placeholder="SP"
            />
          </FormCampo> 
        </FormSecao>

        <FormSecao>
          <CampoConsulta
            campo={ campoPais }
            Consulta={ PaisConsulta }
            rotulo="País"
            rotuloCodigo="Código do país"
            rotuloNome="Nome do país"
            obrigatorio
            erroApi={ errosCampo.codPais }
            colunas={ [ 2, 1, 4 ] }
          />

          <FormCampo label='Status' colunas={ 2 }>
            <CaixaSelecao
              value={ form.isActive }
              onChange={ ( evento ) => setForm ( { ...form, isActive: evento } ) }
            />
          </FormCampo>
        </FormSecao>

        <FormAcoes>
          <Botao type="button" $variante="secundario" onClick={ onCancelar }>
            Cancelar
          </Botao>
          <Botao type="submit" disabled={ salvando }>
            { salvando ? 'Salvando…' : 'Salvar' }
          </Botao>
        </FormAcoes>
      </FormModal>
    </>
  );
}
