import { ContainerCaixaSelecao, InputCaixaSelecao } from './style';

interface PropsCaixaSelecao
{
  value: boolean;
  onChange: ( novoValor: boolean ) => void;
  desabilitado?: boolean;
}

export function CaixaSelecao
(
  { value, onChange, desabilitado = false }: PropsCaixaSelecao
)
{
  function handleChange ( evento: React.ChangeEvent<HTMLInputElement> )
  {
    onChange ( evento.target.checked );
  }

  return (
    <ContainerCaixaSelecao $desabilitado={ desabilitado }>
      <InputCaixaSelecao
        type="checkbox"
        checked={ value }
        onChange={ handleChange }
        disabled={ desabilitado }
      />
    </ContainerCaixaSelecao>
  );
}
