import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installGlobalErrorHandlers } from './lib/errorReporting';
import './index.css';

// Erros não tratados vão para Gestão > Registros
installGlobalErrorHandlers();
// Página carregou: libera a recarga automática para a próxima atualização do site
setTimeout(() => { try { sessionStorage.removeItem('t3:chunk-reload'); } catch { /* sem storage */ } }, 10_000);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
);