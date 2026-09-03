import { useState } from 'react';
import { ApiError } from '../../services/api';
import { formasPagamentoService, type FormaPagamento, type CreateFormaPagamentoInput, type UpdateFormaPagamentoInput } from '../../services/formasPagamento';
import { FormModal, FormSecao, FormCampo, FormAcoes, Botao } from './style';
import { CaixaSelecao } from '../../components/caixaSelecao';

interface Props
{
  inicial: Partial < FormaPagamento >;
  onSalvo: () => void;
  onCancelar: () => void;
}

export function FormaPagamentoForm ( { inicial, onSalvo, onCancelar }: Props )
{
  const [ form, setForm ] = useState < CreateFormaPagamentoInput > ({
    formaDePag:       inicial.formaDePag       ?? '',
    prazoCompensacao: inicial.prazoCompensacao ?? undefined,
    isActive:         inicial.isActive         ?? true,
  });
  const [ erro, setErro ] = useState ( '' );
  const [ errosCampo, setErrosCampo ] = useState < Record < string, string > > ({});
  const [ salvando, setSalvando ] = useState ( false );

  const editando = !!inicial.codFormaDePag;

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
        const dados: UpdateFormaPagamentoInput =
        {
          formaDePag: form.formaDePag,
          isActive:   form.isActive,
        };
        await formasPagamentoService.atualizar ( inicial.codFormaDePag!, dados );
      }
      else
      {
        const dados: CreateFormaPagamentoInput = { ...form };
        await formasPagamentoService.criar ( dados );
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
      titulo={ editando ? 'Editar forma de pagamento' : 'Nova forma de pagamento' }
      erro={ erro }
      onFechar={ onCancelar }
      onSubmit={ submit }
    >
      <FormSecao>
        <FormCampo label="Forma de pagamento" obrigatorio colunas={ 6 } htmlFor="formaDePag" erro={ errosCampo.formaDePag }>
          <input
            id="formaDePag"
            value={ form.formaDePag }
            onChange={ ( evento ) => setForm ( { ...form, formaDePag: evento.target.value.toLocaleUpperCase() } ) }
            maxLength={ 50 }
            required
            autoFocus
          />
        </FormCampo>

        <FormCampo label="Prazo de compensação (dias)" colunas={ 3 } htmlFor="prazoCompensacao" erro={ errosCampo.prazoCompensacao }>
          <input
            id="prazoCompensacao"
            type="number"
            min="0"
            step="1"
            value={ form.prazoCompensacao ?? '' }
            onChange={ ( evento ) =>
              setForm ( { ...form, prazoCompensacao: evento.target.value ? parseInt ( evento.target.value ) : undefined } )
            }
            placeholder="0"
            disabled={ editando }
            readOnly={ editando }
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
  );
}
