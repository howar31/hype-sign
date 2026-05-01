import { useState } from 'react';
import { useSettings } from './store/settingsStore';
import { StaticDisplay } from './components/display/StaticDisplay';
import { MarqueeDisplay } from './components/display/MarqueeDisplay';
import { SettingsPanel } from './components/settings/SettingsPanel';

export function App() {
  const mode = useSettings((s) => s.mode);
  const rotation = useSettings((s) => s.rotation);
  const [open, setOpen] = useState(false);
  // Tap the canvas to hide / show the floating settings button so the
  // display can be uncluttered. When hidden, pointer-events: none lets the
  // tap pass through to display-root, which flips it back on.
  const [toggleVisible, setToggleVisible] = useState(true);

  const rotated = rotation === 90 || rotation === 270;
  const transformStyle = rotation === 0
    ? undefined
    : {
        transform: `rotate(${rotation}deg)`,
        width: rotated ? '100dvh' : '100dvw',
        height: rotated ? '100dvw' : '100dvh',
        transformOrigin: 'center center',
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        marginLeft: rotated ? '-50dvh' : '-50dvw',
        marginTop: rotated ? '-50dvw' : '-50dvh',
      };

  function onCanvasClick() {
    // Drawer is handling its own clicks (backdrop closes it); don't
    // double-fire visibility toggling while it's open.
    if (open) return;
    setToggleVisible((v) => !v);
  }

  return (
    <>
      <div className="display-root" onClick={onCanvasClick}>
        <div style={transformStyle ?? { width: '100%', height: '100%' }}>
          {mode === 'static' ? <StaticDisplay /> : <MarqueeDisplay />}
        </div>
      </div>

      <button
        type="button"
        className={`settings-toggle${toggleVisible ? '' : ' hidden'}`}
        aria-label="Open settings"
        aria-hidden={!toggleVisible}
        onClick={() => setOpen(true)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="17" cy="7" r="2.6" fill="currentColor" />
          <circle cx="8" cy="12" r="2.6" fill="currentColor" />
          <circle cx="15" cy="17" r="2.6" fill="currentColor" />
        </svg>
      </button>

      <SettingsPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
