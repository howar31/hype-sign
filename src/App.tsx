import { useState } from 'react';
import { useSettings } from './store/settingsStore';
import { colorToCss } from './lib/colorToCss';
import { StaticDisplay } from './components/display/StaticDisplay';
import { MarqueeDisplay } from './components/display/MarqueeDisplay';
import { SettingsPanel } from './components/settings/SettingsPanel';

export function App() {
  const mode = useSettings((s) => s.mode);
  const rotation = useSettings((s) => s.rotation);
  const bgColor = useSettings((s) => s.bgColor);
  const [open, setOpen] = useState(false);
  // Tap the canvas to hide / show the floating settings button so the
  // display can be uncluttered. When hidden, pointer-events: none lets the
  // tap pass through to display-root, which flips it back on.
  const [toggleVisible, setToggleVisible] = useState(true);

  const bg = colorToCss(bgColor);

  const rotated = rotation === 90 || rotation === 270;
  // Rotation wrapper sizes itself to .display-root (the safe-area-aware
  // canvas), not the raw viewport. When rotated 90°/270° we swap pre-
  // rotation dims with the parent's post-rotation dims:
  //   pre-rotation width  = parent height = calc(100dvh - var(--sai-top))
  //   pre-rotation height = parent width  = 100vw
  // (100% on the height property resolves to parent.height — *not*
  // parent.width — so we must spell out 100vw explicitly.)
  const transformStyle = rotation === 0
    ? undefined
    : {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        width: rotated ? 'calc(100dvh - var(--sai-top))' : '100%',
        height: rotated ? '100vw' : 'calc(100dvh - var(--sai-top))',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      };

  function onCanvasClick() {
    // Drawer is handling its own clicks (backdrop closes it); don't
    // double-fire visibility toggling while it's open.
    if (open) return;
    setToggleVisible((v) => !v);
  }

  return (
    <>
      {/* Edge-to-edge background. Sits behind everything so the bg color
          extends under the iOS notch / home-indicator areas, while the
          display-root above respects safe-area insets so text content
          stays out of those obstructions. */}
      <div className="bg-layer" aria-hidden style={{ background: bg }} />

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
