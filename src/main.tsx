import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { FONT_FAMILY } from './lib/measureText';
import { initSwUpdateWatcher } from './lib/swUpdate';
import './styles/global.css';

// Inject the canonical font stack as a CSS variable so global.css and
// canvas-based text measurement share a single source of truth.
document.documentElement.style.setProperty('--font-family', FONT_FAMILY);

// Passive listener — the plugin's auto-injected registerSW.js still owns
// registration; we only observe controllerchange to surface a UI hint.
initSwUpdateWatcher();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
