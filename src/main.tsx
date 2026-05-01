import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { FONT_FAMILY } from './lib/measureText';
import './styles/global.css';

// Inject the canonical font stack as a CSS variable so global.css and
// canvas-based text measurement share a single source of truth.
document.documentElement.style.setProperty('--font-family', FONT_FAMILY);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
