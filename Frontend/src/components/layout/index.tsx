import { NavLink } from 'react-router-dom';
import { Shell, Sidebar, Conteudo, NavGrupo, NavGrupoLabel, NavSubLink } from './style';

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
          <NavGrupo>
            <NavGrupoLabel>Geográfico</NavGrupoLabel>
            <NavSubLink as={ NavLink } to="/paises">Países</NavSubLink>
            <NavSubLink as={ NavLink } to="/estados">Estados</NavSubLink>
            <NavSubLink as={ NavLink } to="/cidades">Cidades</NavSubLink>
          </NavGrupo>
          <NavGrupo>
            <NavGrupoLabel>Catálogo</NavGrupoLabel>
            <NavSubLink as={NavLink} to="/categorias">Categorias</NavSubLink>
            <NavSubLink as={NavLink} to="/produtos">Produtos</NavSubLink>
          </NavGrupo>
          <NavGrupo>
            <NavGrupoLabel>Parceiros</NavGrupoLabel>
            <NavSubLink as={ NavLink } to="/fornecedores">Fornecedores</NavSubLink>
            <NavSubLink as={ NavLink } to="/transportadoras">Transportadoras</NavSubLink>
            <NavSubLink as={ NavLink } to="/veiculos">Veículos</NavSubLink>
            <NavSubLink as={ NavLink } to="/clientes">Clientes</NavSubLink>
          </NavGrupo>
          <NavGrupo>
            <NavGrupoLabel>Financeiro</NavGrupoLabel>
            <NavSubLink as={ NavLink } to="/condicoes-pagamento">Condições de Pagamento</NavSubLink>
            <NavSubLink as={ NavLink } to="/formas-pagamento">Formas de Pagamento</NavSubLink>
            <NavSubLink as={ NavLink } to="/compras">Compras</NavSubLink>
            <NavSubLink as={ NavLink } to="/notas-fiscais">Notas Fiscais</NavSubLink>
            <NavSubLink as={ NavLink } to="/contas-pagamento">Contas a Pagar</NavSubLink>
            <NavSubLink as={ NavLink } to="/contas-receber">Contas a Receber</NavSubLink>
          </NavGrupo>
          <NavGrupo>
            <NavGrupoLabel>Atendimento</NavGrupoLabel>
            <NavSubLink as={ NavLink } to="/ordens-servico">Ordens de Serviço</NavSubLink>
            <NavSubLink as={ NavLink } to="/procedimentos">Procedimentos</NavSubLink>
          </NavGrupo>
        </nav>
      </Sidebar>
      <Conteudo>{ children }</Conteudo>
    </Shell>
  );
}
