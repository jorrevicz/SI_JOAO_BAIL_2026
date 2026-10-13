import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { MainGlobalStyles } from './styles/globalStyles';
import { theme } from './themes';
import Layout from './components/layout';
import HomePage from './pages/home'
import { PaisesPage }     from './pages/paises';
import { EstadosPage }    from './pages/estados';
import { CidadesPage }    from './pages/cidades';
import CategoriasPage      from './pages/categorias';
import ProdutosPage        from './pages/produtos';
import VeiculosPage        from './pages/veiculos';
import FornecedoresPage    from './pages/fornecedores';
import ClientesPage        from './pages/clientes';
import TransportadorasPage    from './pages/transportadoras';
import CondicoesPagamentoPage from './pages/condicoesPagamento-Parcela';
import { FormasPagamentoPage }    from './pages/formasPagamento';
import ContasPagamentoPage    from './pages/contasPagamento';
import ContasReceberPage      from './pages/contasReceber';
import ComprasPage            from './pages/compras';
import ProcedimentosPage      from './pages/procedimentos';
import ProcedimentosOSPage    from './pages/procedimentosOS';
import OrdensServicoPage      from './pages/ordensServico';

ReactDOM.createRoot ( document.getElementById ( 'root' )! ).render(
  <React.StrictMode>
    <ThemeProvider theme={ theme }>
      <MainGlobalStyles />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/paises"      element={<PaisesPage />} />
            <Route path="/estados"     element={<EstadosPage />} />
            <Route path="/cidades"     element={<CidadesPage />} />
            <Route path="/categorias"      element={<CategoriasPage />} />
            <Route path="/produtos"        element={<ProdutosPage />} />
            <Route path="/veiculos"        element={<VeiculosPage />} />
            <Route path="/fornecedores"    element={<FornecedoresPage />} />
            <Route path="/clientes"        element={<ClientesPage />} />
            <Route path="/transportadoras"     element={<TransportadorasPage />} />
            <Route path="/condicoes-pagamento" element={<CondicoesPagamentoPage />} />
            <Route path="/formas-pagamento"    element={<FormasPagamentoPage />} />
            <Route path="/contas-pagamento"    element={<ContasPagamentoPage />} />
            <Route path="/contas-receber"      element={<ContasReceberPage />} />
            <Route path="/compras"             element={<ComprasPage />} />
            <Route path="/procedimentos"       element={<ProcedimentosPage />} />
            <Route path="/procedimentos-os"    element={<ProcedimentosOSPage />} />
            <Route path="/ordens-servico"      element={<OrdensServicoPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
