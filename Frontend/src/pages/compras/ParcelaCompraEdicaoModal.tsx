import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formasPagamentoService } from '../../services/formasPagamento';
import { CampoConsulta } from '../../components/campoConsulta';
import { useCampoConsulta } from '../../hooks/campoConsulta';
import { FormaPagamentoConsulta } from '../formasPagamento/FormaPagamentoConsulta';
import { emCentavos, type ParcelaLocal } from './parcelas';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';

interface Props
{
  parcela:   ParcelaLocal;
  onSalvar:  ( parcela: ParcelaLocal ) => void;
  onFechar:  () => void;
}

// Edição de uma parcela da compra (RN023) num modal próprio. Devolve a parcela ajustada
// ao formulário da compra: nada aqui toca a condição de pagamento nem suas Parcelas.
// É renderizado no <body> para não ficar aninhado no <form> do CompraForm.
export function ParcelaCompraEdicaoModal ( { parcela, onSalvar, onFechar }: Props )
{
  const campoForma = useCampoConsulta (
    {
      codigoInicial: Number ( parcela.codFormaDePag ),
      buscar:        formasPagamentoService.obter,
      codigoDe:      ( forma ) => forma.codFormaDePag,
      descricaoDe:   ( forma ) => forma.formaDePag,
    }
  );
  const [ valor, setValor ]               = useState ( parcela.valor );
  const [ dtVencimento, setDtVencimento ] = useState ( parcela.dtVencimento );
  const [ erroForma, setErroForma ]       = useState ( '' );
  const [ erroValor, setErroValor ]       = useState ( '' );

  const submit = async ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();

    const forma = await campoForma.resolver();

    setErroForma ( forma || campoForma.codigo ? '' : 'Selecione uma forma de pagamento.' );
    setErroValor ( emCentavos ( valor ) > 0 ? '' : 'Informe um valor maior que zero.' );

    if ( !forma || emCentavos ( valor ) <= 0 )
    {
      return;
    }

    onSalvar ( { numParcela: parcela.numParcela, codFormaDePag: String ( forma.codFormaDePag ), valor, dtVencimento } );
  };

  return createPortal (
    <FormModal titulo={ `Editar parcela ${ parcela.numParcela }` } onFechar={ onFechar } onSubmit={ ( evento ) => { void submit ( evento ); } }>
      <FormSecao>
        <FormCampo label="Nº da parcela" colunas={ 1.5 } htmlFor="editarParcelaNumero">
          <input id="editarParcelaNumero" value={ parcela.numParcela } disabled readOnly />
        </FormCampo>

        <CampoConsulta
          campo={ campoForma }
          Consulta={ FormaPagamentoConsulta }
          rotulo="Forma de pagamento"
          rotuloCodigo="Código da forma"
          rotuloNome="Descrição da forma"
          obrigatorio
          erroApi={ erroForma }
          colunas={ [ 2, 1, 2.5 ] }
        />

        <FormCampo label="Valor (R$)" obrigatorio colunas={ 2 } htmlFor="editarParcelaValor" erro={ erroValor }>
          <input
            id="editarParcelaValor"
            type="number"
            min="0.01"
            step="0.01"
            value={ valor }
            onChange={ ( evento ) => setValor ( evento.target.value ) }
            autoFocus
          />
        </FormCampo>

        <FormCampo label="Vencimento (UTC)" obrigatorio colunas={ 3 } htmlFor="editarParcelaVencimento">
          <input
            id="editarParcelaVencimento"
            type="datetime-local"
            value={ dtVencimento }
            onChange={ ( evento ) => setDtVencimento ( evento.target.value ) }
            required
          />
        </FormCampo>
      </FormSecao>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onFechar }>Cancelar</Botao>
        <Botao type="submit">Salvar</Botao>
      </FormAcoes>
    </FormModal>,
    document.body
  );
}
