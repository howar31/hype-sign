import { useState } from 'react';
import { useSettings } from './store/settingsStore';
import { StaticDisplay } from './components/display/StaticDisplay';
import { MarqueeDisplay } from './components/display/MarqueeDisplay';
import { SettingsPanel } from './components/settings/SettingsPanel';

export function App() {
  const mode = useSettings((s) => s.mode);
  const rotation = useSettings((s) => s.rotation);
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <div className="display-root">
        <div style={transformStyle ?? { width: '100%', height: '100%' }}>
          {mode === 'static' ? <StaticDisplay /> : <MarqueeDisplay />}
        </div>
      </div>

      <button
        type="button"
        className="settings-toggle"
        aria-label="Open settings"
        onClick={() => setOpen(true)}
      >
        ⚙
      </button>

      <SettingsPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
