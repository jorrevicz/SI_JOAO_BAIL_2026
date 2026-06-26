import { NavLink } from 'react-router-dom';
import { Shell, Sidebar, Conteudo } from './style';

export default function Layout
(
  { children }: { children: React.ReactNode }
) 
{
  return (
    <Shell>
      <Sidebar>
        <NavLink to="/"><h1>SI João Bail</h1></NavLink>
        <nav>
          <NavLink to="/paises">Geográfico</NavLink>
          {/* <NavLink to="/estados">Estados</NavLink>
          <NavLink to="/cidades">Cidades</NavLink> */}
        </nav>
      </Sidebar>
      <Conteudo>{ children }</Conteudo>
    </Shell>
  );
}
