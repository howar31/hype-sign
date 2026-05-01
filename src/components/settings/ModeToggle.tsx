import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';

export function ModeToggle() {
  const mode = useSettings((s) => s.mode);
  const setMode = useSettings((s) => s.setMode);
  const t = useT();

  return (
    <div className="section">
      <span className="section-label">{t('mode.label')}</span>
      <div className="tab-row">
        <button
          type="button"
          className={`tab${mode === 'static' ? ' active' : ''}`}
          onClick={() => setMode('static')}
        >
          {t('mode.static')}
        </button>
        <button
          type="button"
          className={`tab${mode === 'marquee' ? ' active' : ''}`}
          onClick={() => setMode('marquee')}
        >
          {t('mode.marquee')}
        </button>
      </div>
    </div>
  );
}
