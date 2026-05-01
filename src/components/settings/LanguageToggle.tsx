import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';

export function LanguageToggle() {
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const t = useT();

  return (
    <div className="section">
      <span className="section-label">{t('lang.label')}</span>
      <div className="tab-row">
        <button
          type="button"
          className={`tab${lang === 'zh-TW' ? ' active' : ''}`}
          onClick={() => setLang('zh-TW')}
        >
          {t('lang.zh')}
        </button>
        <button
          type="button"
          className={`tab${lang === 'en' ? ' active' : ''}`}
          onClick={() => setLang('en')}
        >
          {t('lang.en')}
        </button>
      </div>
    </div>
  );
}
