import { useState } from 'react';
import { type Categoria } from '../../services/categorias';
import { CategoriaConsulta } from '../categorias/CategoriaConsulta';
import { FormSecao, FormCampo, Botao } from './style';

/**
 * Categoria na lista em edição do formulário. `_uid` identifica a linha na tela:
 * é o próprio código para vínculos já gravados e um UUID para os recém-adicionados.
 */
export interface CategoriaLocal
{
  _uid:          string;
  codCategoria:  number;
  nomeCategoria: string;
}

interface Props
{
  categorias:  CategoriaLocal[];
  onAdicionar: ( categoria: CategoriaLocal ) => void;
}

export function ProdutoCategoriaForm ( { categorias, onAdicionar }: Props )
{
  const [ codCategoria, setCodCategoria ]   = useState ( 0 );
  const [ nomeCategoria, setNomeCategoria ] = useState ( '' );
  const [ consultando, setConsultando ]     = useState ( false );
  const [ erroCategoria, setErroCategoria ] = useState ( '' );

  const HandleSelecionarCategoria = ( oCategoria: Categoria ) =>
  {
    setCodCategoria ( oCategoria.codCategoria );
    setNomeCategoria ( oCategoria.categoria );
    setErroCategoria ( '' );
    setConsultando ( false );
  };

  const HandleAdicionar = () =>
  {
    if ( !codCategoria )
    {
      setErroCategoria ( 'Selecione uma categoria.' );
      return;
    }

    // A associativa tem chave ( codProduto, codCategoria ): repetir violaria a unicidade
    const jaVinculada = categorias.some(
      ( categoria ) => categoria.codCategoria === codCategoria
    );

    if ( jaVinculada )
    {
      setErroCategoria ( 'Esta categoria já foi adicionada ao produto.' );
      return;
    }

    setErroCategoria ( '' );

    onAdicionar ( {
      _uid: crypto.randomUUID(),
      codCategoria,
      nomeCategoria,
    } );

    setCodCategoria ( 0 );
    setNomeCategoria ( '' );
  };

  return (
    <>
      <FormSecao>
        <FormCampo label="Categoria" obrigatorio colunas={ 6 } erro={ erroCategoria }>
          <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
            <Botao
              type="button"
              $variante="secundario"
              onClick={ () => setConsultando ( true ) }
            >
              Consultar
            </Botao>
            {
              nomeCategoria && (
                <span style={ { fontSize: '0.875rem' } }>
                  { nomeCategoria }
                </span>
              )
            }
          </div>
        </FormCampo>

        <FormCampo colunas={ 6 }>
          <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
            <Botao type="button" onClick={ HandleAdicionar }>
              Adicionar categoria
            </Botao>
          </div>
        </FormCampo>
      </FormSecao>

      {
        consultando && (
          <CategoriaConsulta
            onSelecionar={ HandleSelecionarCategoria }
            onCancelar={ () => setConsultando ( false ) }
          />
        )
      }
    </>
  );
}
