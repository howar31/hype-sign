import { useEffect, useRef, useState } from 'react';
import { useT } from '../../lib/i18n';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useSettings } from '../../store/settingsStore';
import { TextSection } from './sections/TextSection';
import { FontSection } from './sections/FontSection';
import { TextColorSection } from './sections/TextColorSection';
import { BackgroundColorSection } from './sections/BackgroundColorSection';
import { OtherSection } from './sections/OtherSection';

type Props = {
  isDesktop: boolean;
};

type Tab = 'text' | 'font' | 'tint' | 'backdrop' | 'settings';

const TABS: { id: Tab; key: string }[] = [
  { id: 'text', key: 'tab.text' },
  { id: 'font', key: 'tab.font' },
  { id: 'tint', key: 'tab.tint' },
  { id: 'backdrop', key: 'tab.backdrop' },
  { id: 'settings', key: 'tab.settings' },
];

const HEADER_MIN_VISIBLE = 80;

function clampFloatingPos(
  x: number,
  y: number,
  panelW: number,
  vw: number,
  vh: number,
) {
  return {
    x: Math.max(-(panelW - HEADER_MIN_VISIBLE), Math.min(x, vw - HEADER_MIN_VISIBLE)),
    y: Math.max(0, Math.min(y, vh - HEADER_MIN_VISIBLE)),
  };
}

export function SettingsPanel({ isDesktop }: Props) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('text');

  const panelMode = useSettings((s) => s.panelMode);
  const panelVisible = useSettings((s) => s.panelVisible);
  const floatingPos = useSettings((s) => s.floatingPos);
  const mobilePanelHeight = useSettings((s) => s.mobilePanelHeight);
  const floatingHeight = useSettings((s) => s.floatingHeight);
  const closePanel = useSettings((s) => s.closePanel);
  const setPanelMode = useSettings((s) => s.setPanelMode);
  const setFloatingPos = useSettings((s) => s.setFloatingPos);
  const setMobilePanelHeight = useSettings((s) => s.setMobilePanelHeight);
  const setFloatingHeight = useSettings((s) => s.setFloatingHeight);

  const asideRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
  } | null>(null);
  const floatingResizeStateRef = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
  } | null>(null);

  // Keep screen awake whenever the app is mounted.
  useWakeLock(true);

  // ESC closes panel.
  useEffect(() => {
    if (!panelVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [panelVisible, closePanel]);

  // On hydrate / viewport resize, re-clamp persisted floating position so a
  // value saved at a larger viewport doesn't leak off-screen.
  useEffect(() => {
    if (!isDesktop || panelMode !== 'floating') return;
    const reclamp = () => {
      const el = asideRef.current;
      const w = el?.offsetWidth ?? 380;
      const next = clampFloatingPos(
        floatingPos.x,
        floatingPos.y,
        w,
        window.innerWidth,
        window.innerHeight,
      );
      if (next.x !== floatingPos.x || next.y !== floatingPos.y) {
        setFloatingPos(next);
      }
    };
    reclamp();
    window.addEventListener('resize', reclamp);
    return () => window.removeEventListener('resize', reclamp);
  }, [isDesktop, panelMode, floatingPos, setFloatingPos]);

  const isFloating = panelMode === 'floating' && isDesktop;

  // Header drag (floating mode only, desktop).
  function onHeaderPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (!isFloating) return;
    // Don't start drag from button clicks (close / mode toggle).
    if ((e.target as HTMLElement).closest('button')) return;
    const aside = asideRef.current;
    if (!aside) return;
    const rect = aside.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onHeaderPointerMove(e: React.PointerEvent<HTMLElement>) {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const aside = asideRef.current;
    const w = aside?.offsetWidth ?? 380;
    const next = clampFloatingPos(
      e.clientX - drag.offsetX,
      e.clientY - drag.offsetY,
      w,
      window.innerWidth,
      window.innerHeight,
    );
    setFloatingPos(next);
  }

  function onHeaderPointerUp(e: React.PointerEvent<HTMLElement>) {
    if (dragStateRef.current?.pointerId === e.pointerId) {
      dragStateRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore — pointer capture may have already been released
      }
    }
  }

  // Mobile resize handle drag.
  function onResizeHandlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    resizeStateRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startHeight: mobilePanelHeight,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onResizeHandlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const r = resizeStateRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    // Pulling up (negative dy) increases height.
    const dy = e.clientY - r.startY;
    setMobilePanelHeight(r.startHeight - dy);
  }

  function onResizeHandlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (resizeStateRef.current?.pointerId === e.pointerId) {
      resizeStateRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  }

  // Floating bottom-handle drag — anchor stays at the panel's top, so
  // dragging DOWN (positive dy) increases height (opposite sign from the
  // mobile top handle, where the panel is anchored at the bottom).
  function onFloatingResizePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    floatingResizeStateRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startHeight: floatingHeight,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onFloatingResizePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const r = floatingResizeStateRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    const dy = e.clientY - r.startY;
    setFloatingHeight(r.startHeight + dy);
  }

  function onFloatingResizePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (floatingResizeStateRef.current?.pointerId === e.pointerId) {
      floatingResizeStateRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  }

  const className = [
    'drawer',
    isFloating ? 'drawer--floating' : 'drawer--split',
    panelVisible ? 'open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const floatingStyle = isFloating
    ? { left: floatingPos.x, top: floatingPos.y }
    : undefined;

  return (
    <aside
      ref={asideRef}
      className={className}
      aria-hidden={!panelVisible}
      style={floatingStyle}
    >
      {!isDesktop && (
        <button
          type="button"
          className="drawer-resize-handle"
          aria-label={t('panel.resizeHandle')}
          onPointerDown={onResizeHandlePointerDown}
          onPointerMove={onResizeHandlePointerMove}
          onPointerUp={onResizeHandlePointerUp}
          onPointerCancel={onResizeHandlePointerUp}
        />
      )}

      <header
        className={`drawer-header${isFloating ? ' draggable' : ''}`}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
      >
        <h2 className="drawer-title">{t('settings.title')}</h2>
        <div className="drawer-header-actions">
          {isDesktop && (
            <button
              type="button"
              className="drawer-mode-toggle"
              onClick={() => setPanelMode(panelMode === 'split' ? 'floating' : 'split')}
              aria-label={t('panel.toggleMode')}
              title={panelMode === 'split' ? t('panel.modeFloating') : t('panel.modeSplit')}
            >
              {panelMode === 'split' ? (
                // Pop-out / detach icon — switches to floating.
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M14 4h6v6M20 4l-8 8M5 8v11h11v-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                // Dock-back icon — switches to split.
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect
                    x="3.5"
                    y="4.5"
                    width="17"
                    height="15"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <line
                    x1="14"
                    y1="4.5"
                    x2="14"
                    y2="19.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            className="drawer-close"
            onClick={closePanel}
            aria-label={t('settings.close')}
          >
            ✕
          </button>
        </div>
      </header>

      <nav className="drawer-tabs" role="tablist">
        {TABS.map(({ id, key }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {t(key)}
          </button>
        ))}
      </nav>

      {/* All sections stay mounted; only their visibility toggles. This
          preserves per-section local state (color editor snapshots,
          preset name inputs, ConfirmButton armed state, etc.) across
          tab switches. */}
      <div className="drawer-body">
        <div className="tab-pane" hidden={tab !== 'text'}>
          <TextSection />
        </div>
        <div className="tab-pane" hidden={tab !== 'font'}>
          <FontSection />
        </div>
        <div className="tab-pane" hidden={tab !== 'tint'}>
          <TextColorSection />
        </div>
        <div className="tab-pane" hidden={tab !== 'backdrop'}>
          <BackgroundColorSection />
        </div>
        <div className="tab-pane" hidden={tab !== 'settings'}>
          <OtherSection />
        </div>
      </div>

      {isFloating && (
        <button
          type="button"
          className="drawer-resize-handle"
          aria-label={t('panel.resizeHandle')}
          onPointerDown={onFloatingResizePointerDown}
          onPointerMove={onFloatingResizePointerMove}
          onPointerUp={onFloatingResizePointerUp}
          onPointerCancel={onFloatingResizePointerUp}
        />
      )}
    </aside>
  );
}
