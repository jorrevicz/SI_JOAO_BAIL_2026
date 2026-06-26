import { useNavigate } from 'react-router-dom';
import { buildQueryString } from '../../utils/queryParams';
import { Botao } from '../botao/style';

type Params = Record < string, string | number | null | undefined >;

interface Props
{
  rota: string;
  params?: Params;
  children: React.ReactNode;
}

export default function BotaoConsultar ( { rota, params = {}, children }: Props )
{
  const navigate = useNavigate();

  const handleClick = () =>
  {
    navigate ( `${ rota }${ buildQueryString ( params ) }` );
  };

  return (
    <Botao $variante="secundario" onClick={ handleClick }>
      { children }
    </Botao>
  );
}
