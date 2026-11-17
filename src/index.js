import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Loaded after the page stylesheets so the responsive/RTL layer can override them
import './styles/Sections.css';
import './styles/responsive.css';
import reportWebVitals from './reportWebVitals';
import { LanguageProvider } from './i18n/LanguageContext';
import { registerServiceWorker } from './components/pwa';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);

reportWebVitals();
registerServiceWorker();
