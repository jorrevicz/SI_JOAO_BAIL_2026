'use no memo';

import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api';
import { produtosService, type Produto, type CreateProdutoInput, type UpdateProdutoInput } from '../../services/produtos';
import { produtoCategoriasService } from '../../services/produtoCategorias';
import { categoriasService } from '../../services/categorias';
import {
  FormModal,
  FormSecao,
  FormCampo,
  FormAcoes,
  Botao,
  GrupoBotoes,
  TabelaWrapper,
  Tabela,
  ErroCampo
} from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { ProdutoCategoriaForm, type CategoriaLocal } from './ProdutoCategoriaForm';

interface Props
{
  inicial:          Partial < Produto >;
  codCategoriaFixa?: number;
  onSalvo:          () => void;
  onCancelar:       () => void;
}

export default function ProdutoForm ( { inicial, codCategoriaFixa, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < Omit < CreateProdutoInput, 'categorias' > > ( {
    produto:      inicial.produto      ?? '',
    undProduto:   inicial.undProduto   ?? '',
    estoque:      inicial.estoque      != null ? inicial.estoque : undefined as number | undefined,
    custo:        inicial.custoMedioProd != null ? parseFloat ( inicial.custoMedioProd ) : undefined as number | undefined,
    pesoBruto:    inicial.pesoBruto    != null ? parseFloat ( inicial.pesoBruto ) : undefined as number | undefined,
    pesoLiq:      inicial.pesoLiq      != null ? parseFloat ( inicial.pesoLiq   ) : undefined as number | undefined,
    isActive:     inicial.isActive     ?? true,
  } );
  const [ categorias, setCategorias ] = useState < CategoriaLocal[] > ( [] );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codProd;

  // Na edição, os vínculos já gravados vêm da associativa; num produto novo aberto a
  // partir de uma categoria, ela entra na lista já selecionada.
  useEffect ( () =>
  {
    async function CarregarCategorias ()
    {
      if ( inicial.codProd )
      {
        const lista = await produtoCategoriasService.listar ( inicial.codProd );

        setCategorias ( lista.map ( ( vinculo ) => ( {
          _uid:          String ( vinculo.codCategoria ),
          codCategoria:  vinculo.codCategoria,
          nomeCategoria: vinculo.categoria,
        } ) ) );

        return;
      }

      if ( codCategoriaFixa )
      {
        const categoria = await categoriasService.obter ( codCategoriaFixa );

        setCategorias ( [ {
          _uid:          String ( categoria.codCategoria ),
          codCategoria:  categoria.codCategoria,
          nomeCategoria: categoria.categoria,
        } ] );
      }
    }

    CarregarCategorias().catch ( ( err: Error ) => setErro ( err.message ) );
  }, [ inicial.codProd, codCategoriaFixa ] );

  const HandleAdicionar = ( categoria: CategoriaLocal ) =>
  {
    setCategorias ( ( anterior ) => [ ...anterior, categoria ] );
  };

  const HandleRemover = ( uid: string ) =>
  {
    setCategorias ( ( anterior ) => anterior.filter ( ( categoria ) => categoria._uid !== uid ) );
  };

  // O produto deve ter ao menos uma categoria — o backend recusa a lista vazia
  const podeSalvar = !salvando && categorias.length > 0;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      // Os campos só de tela (_uid, nomeCategoria) não vão para a API
      const categoriasMapeadas = categorias.map ( ( categoria ) => ( {
        codCategoria: categoria.codCategoria,
      } ) );

      if ( editando )
      {
        const dados: UpdateProdutoInput =
        {
          produto:      form.produto,
          categorias:   categoriasMapeadas,
          undProduto:   form.undProduto   || undefined,
          pesoBruto:    form.pesoBruto    != null && !isNaN ( form.pesoBruto  ) ? form.pesoBruto  : undefined,
          pesoLiq:      form.pesoLiq      != null && !isNaN ( form.pesoLiq    ) ? form.pesoLiq    : undefined,
          isActive:     form.isActive     ?? true,
        };
        await produtosService.atualizar ( inicial.codProd!, dados );
      }
      else
      {
        const dados: CreateProdutoInput =
        {
          produto:      form.produto,
          categorias:   categoriasMapeadas,
          undProduto:   form.undProduto   || undefined,
          estoque:      form.estoque      != null && !isNaN ( form.estoque   ) ? form.estoque   : undefined,
          custo:        form.custo        != null && !isNaN ( form.custo     ) ? form.custo     : undefined,
          pesoBruto:    form.pesoBruto    != null && !isNaN ( form.pesoBruto ) ? form.pesoBruto : undefined,
          pesoLiq:      form.pesoLiq      != null && !isNaN ( form.pesoLiq   ) ? form.pesoLiq   : undefined,
          isActive:     form.isActive     ?? true,
        };
        await produtosService.criar ( dados );
      }
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
      titulo={ editando ? 'Editar produto' : 'Novo produto' }
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Produto" obrigatorio colunas={ 9 } htmlFor="produto" erro={ errosCampo.produto }>
          <input
            id="produto"
            value={ form.produto }
            onChange={ ( evento ) => setForm ( { ...form, produto: evento.target.value.toUpperCase() } ) }
            maxLength={ 100 }
            required
            autoFocus
          />
        </FormCampo>

        <FormCampo label="Unidade" colunas={ 3 } htmlFor="undProduto" erro={ errosCampo.undProduto }>
          <input
            id="undProduto"
            value={ form.undProduto ?? '' }
            onChange={ ( evento ) => setForm ( { ...form, undProduto: evento.target.value.toUpperCase() || '' } ) }
            maxLength={ 4 }
            placeholder="UN, KG, CX…"
          />
        </FormCampo>
      </FormSecao>

      <FormSecao>
        <FormCampo label="Estoque inicial" colunas={ 3 } htmlFor="estoque" erro={ errosCampo.estoque }>
          <input
            id="estoque"
            type="number"
            min="0"
            max="99999"
            step="1"
            value={ form.estoque ?? '' }
            onChange={ ( evento ) =>
              setForm ( { ...form, estoque: evento.target.value ? parseInt ( evento.target.value, 10 ) : undefined } )
            }
            disabled={ editando }
            readOnly={ editando }
          />
        </FormCampo>

        <FormCampo label="Custo inicial (R$)" colunas={ 3 } htmlFor="custo" erro={ errosCampo.custo }>
          <input
            id="custo"
            type="number"
            step="0.01"
            min="0"
            value={ form.custo ?? '' }
            onChange={ ( evento ) =>
              setForm ( { ...form, custo: evento.target.value ? parseFloat ( evento.target.value ) : undefined } )
            }
            disabled={ editando }
            readOnly={ editando }
          />
        </FormCampo>

        <FormCampo label="Peso bruto (kg)" colunas={ 3 } htmlFor="pesoBruto" erro={ errosCampo.pesoBruto }>
          <input
            id="pesoBruto"
            type="number"
            step="0.001"
            min="0"
            value={ form.pesoBruto ?? '' }
            onChange={ ( evento ) =>
              setForm ( { ...form, pesoBruto: evento.target.value ? parseFloat ( evento.target.value ) : undefined } )
            }
          />
        </FormCampo>

        <FormCampo label="Peso líquido (kg)" colunas={ 3 } htmlFor="pesoLiq" erro={ errosCampo.pesoLiq }>
          <input
            id="pesoLiq"
            type="number"
            step="0.001"
            min="0"
            value={ form.pesoLiq ?? '' }
            onChange={ ( evento ) =>
              setForm ( { ...form, pesoLiq: evento.target.value ? parseFloat ( evento.target.value ) : undefined } )
            }
          />
        </FormCampo>

        <FormCampo label='Status' colunas={ 3 }>
          <CaixaSelecao
            value={ form.isActive }
            onChange={ ( evento ) => setForm ( { ...form, isActive: evento } ) }
          />
        </FormCampo>
      </FormSecao>

      <div>
        <h4 style={ { marginBottom: '0.75rem', fontWeight: 600 } }>Categorias</h4>
        <ProdutoCategoriaForm categorias={ categorias } onAdicionar={ HandleAdicionar } />
        {
          categorias.length > 0 && (
            <TabelaWrapper style={ { marginTop: '0.75rem', height: 'auto', maxHeight: '200px' } }>
              <Tabela>
                <thead>
                  <tr>
                    <th style={ { width: '1%', whiteSpace: 'nowrap' } }>Código</th>
                    <th>Categoria</th>
                    <th style={ { width: '1%', whiteSpace: 'nowrap' } }>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    categorias.map ( ( categoria ) => (
                      <tr key={ categoria._uid }>
                        <td style={ { width: '1%', whiteSpace: 'nowrap' } }>{ categoria.codCategoria }</td>
                        <td style={ { textAlign: 'left' } }>{ categoria.nomeCategoria }</td>
                        <td style={ { width: '1%', whiteSpace: 'nowrap' } }>
                          <GrupoBotoes>
                            <Botao
                              type="button"
                              $variante="perigo"
                              onClick={ () => HandleRemover ( categoria._uid ) }
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
        { errosCampo.categorias && <ErroCampo>{ errosCampo.categorias }</ErroCampo> }
      </div>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={ !podeSalvar }>
          { salvando ? 'Salvando…' : 'Salvar' }
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
