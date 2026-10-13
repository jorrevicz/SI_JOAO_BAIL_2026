import { useState } from 'react';
import { produtosService } from '../../services/produtos';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { ProdutoConsulta } from '../produtos/ProdutoConsulta';
import { FormSecao, FormCampo, Botao } from './style';

// Item na lista local do formulário: o que o usuário informa (valores como texto do input)
// mais o nome do produto e a unidade da compra (RN020) para exibição. Rateio, totais e custos vêm do Backend.
export interface ItemLocal
{
  codProduto:    number;
  produto:       string;
  unidade:       string;
  quantidade:    string;
  valorUnitario: string;
  desconto:      string;
}

interface Props
{
  codigosNaLista: number[];
  onAdicionar:    ( item: ItemLocal ) => void;
}

export function CompraItemForm ( { codigosNaLista, onAdicionar }: Props )
{
  const campoProduto = useCampoConsulta (
    {
      codigoInicial: null,
      buscar:        produtosService.obter,
      codigoDe:      ( produto ) => produto.codProd,
      descricaoDe:   ( produto ) => produto.produto,
    }
  );
  const [ quantidade, setQuantidade ]       = useState ( '1' );
  const [ valorUnitario, setValorUnitario ] = useState ( '' );
  const [ desconto, setDesconto ]           = useState ( '' );
  const [ erroProduto, setErroProduto ]     = useState ( '' );

  // RN020 — a unidade nasce com a do cadastro do produto escolhido e pode ser trocada só
  // neste item; o que o usuário digita vale para o produto em que foi digitado.
  const [ unidadeEditada, setUnidadeEditada ] = useState < { codProduto: number; valor: string } | null > ( null );

  const produtoEscolhido = campoProduto.entidade;
  const unidade          = unidadeEditada && unidadeEditada.codProduto === produtoEscolhido?.codProd
    ? unidadeEditada.valor
    : produtoEscolhido?.undProduto ?? '';

  // Confere no banco o código digitado à mão e evita o mesmo produto duas vezes na
  // compra (é a chave do item). As demais regras do item (RN016) são do Backend.
  const HandleAdicionar = async () =>
  {
    if ( !campoProduto.codigo )
    {
      setErroProduto ( 'Selecione um produto.' );
      return;
    }

    const produto = await campoProduto.resolver();

    if ( !produto )
    {
      setErroProduto ( '' );
      return;
    }

    if ( !unidade.trim() )
    {
      setErroProduto ( 'Informe a unidade do produto.' );
      return;
    }

    if ( codigosNaLista.includes ( produto.codProd ) )
    {
      setErroProduto ( 'Este produto já está na compra; remova-o para lançar de novo.' );
      return;
    }

    setErroProduto ( '' );

    onAdicionar ( {
      codProduto:    produto.codProd,
      produto:       produto.produto,
      unidade:       unidade.trim().toUpperCase(),
      quantidade,
      valorUnitario,
      desconto:      desconto || '0',
    } );

    campoProduto.digitar ( '' );
    setUnidadeEditada ( null );
    setQuantidade ( '1' );
    setValorUnitario ( '' );
    setDesconto ( '' );
  };

  return (
    <>
      <FormSecao>
        <CampoConsulta
          campo={ campoProduto }
          Consulta={ ProdutoConsulta }
          rotulo="Produto"
          rotuloCodigo="Código do produto"
          rotuloNome="Descrição do produto"
          obrigatorio
          erroApi={ erroProduto }
          colunas={ [ 2, 1, 2 ] }
        />
      {/* </FormSecao>

      <FormSecao>  */}
        <FormCampo label="Unidade" obrigatorio colunas={ 1 } htmlFor="itemUnidade">
          <input
            id="itemUnidade"
            value={ unidade }
            onChange={ ( evento ) => setUnidadeEditada ( { codProduto: produtoEscolhido?.codProd ?? 0, valor: evento.target.value } ) }
            maxLength={ 4 }
            placeholder="UN"
            disabled={ !produtoEscolhido }
          />
        </FormCampo>

        <FormCampo label="Quantidade" obrigatorio colunas={ 2 } htmlFor="itemQuantidade">
          <input
            id="itemQuantidade"
            type="number"
            min="1"
            step="1"
            value={ quantidade }
            onChange={ ( evento ) => setQuantidade ( evento.target.value ) }
          />
        </FormCampo>

        <FormCampo label="Valor unitário" obrigatorio colunas={ 2 } htmlFor="itemValorUnitario">
          <input
            id="itemValorUnitario"
            type="number"
            min="0.01"
            step="0.01"
            value={ valorUnitario }
            onChange={ ( evento ) => setValorUnitario ( evento.target.value ) }
            placeholder="R$ 0.00"
          />
        </FormCampo>

        <FormCampo label="Desconto (R$)" colunas={ 2 } htmlFor="itemDesconto">
          <input
            id="itemDesconto"
            type="number"
            min="0"
            step="0.01"
            value={ desconto }
            onChange={ ( evento ) => setDesconto ( evento.target.value ) }
            placeholder="0.00"
          />
        </FormCampo>
      </FormSecao>

      <FormSecao>
        <FormCampo colunas={ 12 }>
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
