import { useState } from 'react';
import { FormModal, FormSecao, FormCampo, FormAcoes } from '../form';
import { Botao } from '../botao/style';

interface Props
{
  titulo?:     string;
  onConfirmar: () => void;
  onCancelar:  () => void;
}

// Popup de login/confirmação exigido antes de qualquer cancelamento (RN003/RN014).
// Até o EP-10 (autenticação real) a senha é apenas pedida aqui, sem validação no Backend:
// quando o login existir, este componente passa a enviar a senha e só confirma após o 200.
export function ConfirmarSenhaModal ( { titulo = 'Confirme sua identidade', onConfirmar, onCancelar }: Props )
{
  const [ senha, setSenha ] = useState ( '' );

  const submit = ( evento: React.SyntheticEvent ) =>
  {
    evento.preventDefault();
    onConfirmar();
  };

  return (
    <FormModal titulo={ titulo } onFechar={ onCancelar } onSubmit={ submit }>
      <FormSecao>
        <FormCampo label="Senha" obrigatorio colunas={ 12 } htmlFor="senhaConfirmacao">
          <input
            id="senhaConfirmacao"
            type="password"
            autoComplete="current-password"
            value={ senha }
            onChange={ ( evento ) => setSenha ( evento.target.value ) }
            required
            autoFocus
          />
        </FormCampo>
      </FormSecao>

      <FormAcoes>
        <Botao type="button" $variante="secundario" onClick={ onCancelar }>
          Voltar
        </Botao>
        <Botao type="submit" $variante="perigo" disabled={ !senha }>
          Confirmar
        </Botao>
      </FormAcoes>
    </FormModal>
  );
}
