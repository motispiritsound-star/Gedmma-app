import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/App.tsx';
import { App } from './App.tsx';
import './stijl/tokens.css';
import './stijl/basis.css';

const wortel = document.getElementById('wortel');
if (!wortel) throw new Error('Het element #wortel ontbreekt in index.html.');

createRoot(wortel).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
