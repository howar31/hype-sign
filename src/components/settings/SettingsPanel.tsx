import { useEffect, useState } from 'react';
import { useT } from '../../lib/i18n';
import { useWakeLock } from '../../hooks/useWakeLock';
import { TextSection } from './sections/TextSection';
import { TextColorSection } from './sections/TextColorSection';
import { BackgroundColorSection } from './sections/BackgroundColorSection';
import { OtherSection } from './sections/OtherSection';

type Props = {
  open: boolean;
  onClose: () => void;
};

type Tab = 'text' | 'tint' | 'backdrop' | 'settings';

const TABS: { id: Tab; key: string }[] = [
  { id: 'text', key: 'tab.text' },
  { id: 'tint', key: 'tab.tint' },
  { id: 'backdrop', key: 'tab.backdrop' },
  { id: 'settings', key: 'tab.settings' },
];

export function SettingsPanel({ open, onClose }: Props) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('text');

  // Keep screen awake whenever the app is mounted.
  useWakeLock(true);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`drawer-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden
      />
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <header className="drawer-header">
          <h2 className="drawer-title">{t('settings.title')}</h2>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label={t('settings.close')}
          >
            ✕
          </button>
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
      </aside>
    </>
  );
}
