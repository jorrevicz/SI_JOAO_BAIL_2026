import { useState } from 'react';
import { type Categoria } from '../../services/categorias';
import { ApiError } from '../../services/api';
import { produtosService, type Produto, type CreateProdutoInput, type UpdateProdutoInput } from '../../services/produtos';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';
import { CategoriaConsulta } from '../categorias/CategoriaConsulta';

interface Props
{
  inicial:          Partial < Produto >;
  codCategoriaFixa?: number;
  onSalvo:          () => void;
  onCancelar:       () => void;
}

export default function ProdutoForm ( { inicial, codCategoriaFixa, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState ( {
    produto:      inicial.produto      ?? '',
    codCategoria: inicial.codCategoria ?? codCategoriaFixa,
    undProduto:   inicial.undProduto   ?? '',
    estoque:      inicial.estoque      != null ? inicial.estoque : undefined as number | undefined,
    custo:        inicial.custoMedioProd != null ? parseFloat ( inicial.custoMedioProd ) : undefined as number | undefined,
    pesoBruto:    inicial.pesoBruto    != null ? parseFloat ( inicial.pesoBruto ) : undefined as number | undefined,
    pesoLiq:      inicial.pesoLiq      != null ? parseFloat ( inicial.pesoLiq   ) : undefined as number | undefined,
    isActive:     inicial.isActive     ?? true,
  } );
  const [ nomeCategoriaSel, setNomeCategoriaSel ] = useState ( '' );
  const [ consultando, setConsultando ] = useState ( false );

  const [ erro, setErro ]             = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ( {} );
  const [ salvando, setSalvando ]     = useState ( false );

  const editando = !!inicial.codProd;

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    setSalvando ( true );
    setErro ( '' );
    setErrosCampo ( {} );

    try
    {
      if ( editando )
      {
        const dados: UpdateProdutoInput =
        {
          produto:      form.produto,
          codCategoria: form.codCategoria || undefined,
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
          codCategoria: form.codCategoria || undefined,
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

  const HandleSelecionarCategoria = ( oCategoria: Categoria ) =>
  {
    setForm ( { ...form, codCategoria: oCategoria.codCategoria } );
    setNomeCategoriaSel ( oCategoria.categoria );
    setConsultando ( false );
  }

  return (
    <>
      <FormModal
        titulo={ editando ? 'Editar produto' : 'Novo produto' }
        erro={ erro }
        onFechar={ onCancelar }
        onSubmit={ submit }
      >
        <FormSecao>
          <FormCampo label="Categoria" obrigatorio colunas={ 4 } erro={ errosCampo.codCategoria }>
            <div style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
              <Botao
                type="button"
                $variante="secundario"
                onClick={ () => setConsultando ( true ) }
              >
                Consultar
              </Botao>
              { nomeCategoriaSel && (
                <span style={ { fontSize: '0.875rem' } }>{ nomeCategoriaSel }</span>
              )}
            </div>
          </FormCampo>

          <FormCampo label="Produto" obrigatorio colunas={ 5 } htmlFor="produto" erro={ errosCampo.produto }>
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

        <FormAcoes>
          <Botao type="button" $variante="secundario" onClick={ onCancelar }>
            Cancelar
          </Botao>
          <Botao type="submit" disabled={ salvando }>
            { salvando ? 'Salvando…' : 'Salvar' }
          </Botao>
        </FormAcoes>
      </FormModal>
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
