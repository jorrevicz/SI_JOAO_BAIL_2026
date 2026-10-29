import { useState, type ComponentType } from 'react';
import { FormCampo } from '../form';
import { Botao } from '../botao/style';
import type { CampoConsulta as CampoConsultaEstado } from '../../hooks/campoConsulta';

interface PropsConsulta < T >
{
  onSelecionar: ( entidade: T ) => void;
  onCancelar:   () => void;
}

interface Props < T >
{
  campo:         CampoConsultaEstado < T >;
  Consulta:      ComponentType < PropsConsulta < T > >;
  rotulo:        string;
  rotuloCodigo:  string;
  rotuloNome:    string;
  obrigatorio?:  boolean;
  erroApi?:      string;
  desabilitado?: boolean;
  colunas?:      [ number, number, number ];
}

// Trio padrão dos formulários: botão "Consultar", código editável e descrição somente leitura.
// Renderize dentro de um <FormSecao>.
export function CampoConsulta < T > (
  { campo, Consulta, rotulo, rotuloCodigo, rotuloNome, obrigatorio = false, erroApi, desabilitado = false, colunas = [ 2, 2, 4 ] }: Props < T >
)
{
  const [ consultando, setConsultando ] = useState ( false );

  return (
    <>
      <FormCampo label={ rotuloCodigo } colunas={ colunas[ 1 ] } erro={ campo.erro || erroApi }>
        <input
          inputMode="numeric"
          disabled={ desabilitado }
          value={ campo.texto }
          onChange={ ( evento ) => campo.digitar ( evento.target.value ) }
          onBlur={ () => { void campo.validar(); } }
        />
      </FormCampo>

      <FormCampo label={ rotuloNome } colunas={ colunas[ 2 ] }>
        <input disabled readOnly value={ campo.descricao } />
      </FormCampo>

      {
        consultando && (
          <Consulta
            onSelecionar={ ( entidade ) =>
            {
              campo.selecionar ( entidade );
              setConsultando ( false );
            } }
            onCancelar={ () => setConsultando ( false ) }
          />
        )
      }

      <FormCampo label={ rotulo } obrigatorio={ obrigatorio } colunas={ colunas[ 0 ] }>
        <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
          <Botao type="button" $variante="secundario" disabled={ desabilitado } onClick={ () => setConsultando ( true ) }>
            Consultar
          </Botao>
        </div>
      </FormCampo>
    </>
  );
}
