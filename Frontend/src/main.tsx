import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { MainGlobalStyles } from './styles/globalStyles';
import { theme } from './themes';
import Layout from './components/layout';
import HomePage from './pages/home'
import PaisesPage from './pages/paises';
import EstadosPage from './pages/estados';
import CidadesPage from './pages/cidades';

ReactDOM.createRoot ( document.getElementById ( 'root' )! ).render(
  <React.StrictMode>
    <ThemeProvider theme={ theme }>
      <MainGlobalStyles />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/paises" element={<PaisesPage />} />
            <Route path="/estados" element={<EstadosPage />} />
            <Route path="/cidades" element={<CidadesPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
