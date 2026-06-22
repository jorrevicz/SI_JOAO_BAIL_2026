import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './pages/home'
import MainGlobalStyles from './styles/globalStyles'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainGlobalStyles />
    <Home />
  </React.StrictMode>,
)
