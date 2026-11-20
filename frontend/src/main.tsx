import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App';
import { AppMessageHost } from './components/AppMessage';
import { NotificationCenter } from './components/NotificationCenter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <NotificationCenter />
    <AppMessageHost />
  </StrictMode>,
);
