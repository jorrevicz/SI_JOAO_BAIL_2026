import { useState } from 'react';
import { categoriasService } from '../../services/categorias';
import { CategoriaConsulta } from '../categorias/CategoriaConsulta';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
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
  const campoCategoria = useCampoConsulta (
    {
      codigoInicial: null,
      buscar:        categoriasService.obter,
      codigoDe:      ( categoria ) => categoria.codCategoria,
      descricaoDe:   ( categoria ) => categoria.categoria,
    }
  );
  const [ erroCategoria, setErroCategoria ] = useState ( '' );

  const HandleAdicionar = async () =>
  {
    if ( !campoCategoria.codigo )
    {
      setErroCategoria ( 'Selecione uma categoria.' );
      return;
    }

    // Confere no banco o código digitado à mão antes de incluí-lo na lista
    const categoriaEncontrada = await campoCategoria.resolver();

    if ( !categoriaEncontrada )
    {
      return;
    }

    const codCategoria = categoriaEncontrada.codCategoria;

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
      nomeCategoria: categoriaEncontrada.categoria,
    } );

    campoCategoria.digitar ( '' );
  };

  return (
    <>
      <FormSecao>
        <CampoConsulta
          campo={ campoCategoria }
          Consulta={ CategoriaConsulta }
          rotulo="Categoria"
          rotuloCodigo="Código da categoria"
          rotuloNome="Nome da categoria"
          obrigatorio
          erroApi={ erroCategoria }
          colunas={ [ 2, 1, 4 ] }
        />

        <FormCampo colunas={ 4 }>
          <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
            <Botao type="button" onClick={ () => { void HandleAdicionar(); } }>
              Adicionar categoria
            </Botao>
          </div>
        </FormCampo>
      </FormSecao>
    </>
  );
}
