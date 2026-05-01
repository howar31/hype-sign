import { useEffect, useRef, useState } from 'react';
import { useSettings } from './store/settingsStore';
import { colorToCss } from './lib/colorToCss';
import { StaticDisplay } from './components/display/StaticDisplay';
import { MarqueeDisplay } from './components/display/MarqueeDisplay';
import { SettingsPanel } from './components/settings/SettingsPanel';

const DESKTOP_BREAKPOINT = '(min-width: 768px)';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_BREAKPOINT).matches : true,
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_BREAKPOINT);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export function App() {
  const mode = useSettings((s) => s.mode);
  const rotation = useSettings((s) => s.rotation);
  const bgColor = useSettings((s) => s.bgColor);
  const mobilePanelHeight = useSettings((s) => s.mobilePanelHeight);
  const floatingHeight = useSettings((s) => s.floatingHeight);
  const togglePanel = useSettings((s) => s.togglePanel);

  const isDesktop = useIsDesktop();
  const displayRef = useRef<HTMLDivElement>(null);

  const bg = colorToCss(bgColor);
  const rotated = rotation === 90 || rotation === 270;

  // Publish the persisted panel-height preferences as CSS vars so the
  // drawer rules can size each variant accordingly.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--mobile-panel-height', `${mobilePanelHeight}px`);
    root.style.setProperty('--floating-height', `${floatingHeight}px`);
  }, [mobilePanelHeight, floatingHeight]);

  // Publish .display-root's actual size as inline CSS vars so the rotation
  // wrapper and the display components' edge-margin padding can consume
  // them via var(--display-w / -h / -min). The canvas itself is full-
  // viewport-fixed today, but the ResizeObserver-driven indirection is kept
  // so the rotation/margin code stays robust to any future container size
  // changes (e.g. window resize, future canvas-size feature).
  useEffect(() => {
    const el = displayRef.current;
    if (!el) return;
    const apply = (w: number, h: number) => {
      // Round to integers — sub-pixel CSS var values composed with
      // transform: translate(-50%) caused tiny but visible centering drift
      // on iOS Safari where the rotated wrapper appeared off-center.
      const rw = Math.round(w);
      const rh = Math.round(h);
      el.style.setProperty('--display-w', `${rw}px`);
      el.style.setProperty('--display-h', `${rh}px`);
      el.style.setProperty('--display-min', `${Math.min(rw, rh)}px`);
    };
    apply(el.offsetWidth, el.offsetHeight);
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      apply(width, height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const transformStyle = rotation === 0
    ? undefined
    : {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        width: rotated ? 'var(--display-h)' : 'var(--display-w)',
        height: rotated ? 'var(--display-w)' : 'var(--display-h)',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center center' as const,
      };

  return (
    <>
      {/* Edge-to-edge background. Sits behind everything so the bg color
          extends under the iOS notch / home-indicator areas, while the
          display-root above respects safe-area insets so text content
          stays out of those obstructions. */}
      <div className="bg-layer" aria-hidden style={{ background: bg }} />

      <div ref={displayRef} className="display-root" onClick={togglePanel}>
        <div style={transformStyle ?? { width: '100%', height: '100%' }}>
          {mode === 'static' ? <StaticDisplay /> : <MarqueeDisplay />}
        </div>
      </div>

      <SettingsPanel isDesktop={isDesktop} />
    </>
  );
}
