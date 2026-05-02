import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { getFontFamily } from './lib/fonts';
import { initSwUpdateWatcher } from './lib/swUpdate';
import './styles/global.css';

// UI chrome (settings panel, labels) always uses the system font stack so
// it renders before any web font loads and stays visually neutral. The
// user-selected display font is applied only on the canvas text via the
// display components — see StaticDisplay / MarqueeDisplay.
document.documentElement.style.setProperty('--font-family', getFontFamily('system-sans'));

// Passive listener — the plugin's auto-injected registerSW.js still owns
// registration; we only observe controllerchange to surface a UI hint.
initSwUpdateWatcher();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
