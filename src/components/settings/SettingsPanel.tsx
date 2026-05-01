import { useEffect, useState } from 'react';
import { useT } from '../../lib/i18n';
import { useWakeLock } from '../../hooks/useWakeLock';
import { TextSection } from './sections/TextSection';
import { StyleSection } from './sections/StyleSection';
import { OtherSection } from './sections/OtherSection';

type Props = {
  open: boolean;
  onClose: () => void;
};

type Tab = 'text' | 'style' | 'other';

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
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'text'}
            className={tab === 'text' ? 'active' : ''}
            onClick={() => setTab('text')}
          >
            {t('tab.text')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'style'}
            className={tab === 'style' ? 'active' : ''}
            onClick={() => setTab('style')}
          >
            {t('tab.style')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'other'}
            className={tab === 'other' ? 'active' : ''}
            onClick={() => setTab('other')}
          >
            {t('tab.other')}
          </button>
        </nav>

        <div className="drawer-body">
          {tab === 'text' && <TextSection />}
          {tab === 'style' && <StyleSection />}
          {tab === 'other' && <OtherSection />}
        </div>
      </aside>
    </>
  );
}
