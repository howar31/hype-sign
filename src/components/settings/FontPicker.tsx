import { Fragment, useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import {
  FONT_ORDER,
  FONT_SAMPLE_LINES,
  FONTS,
  clampWeightForFont,
  type FontId,
} from '../../lib/fonts';

export function FontPicker() {
  const font = useSettings((s) => s.font);
  const fontWeight = useSettings((s) => s.fontWeight);
  const lang = useSettings((s) => s.lang);
  const setFont = useSettings((s) => s.setFont);
  const t = useT();

  // Picker-local: when on, render BOTH language lines so the user can
  // compare CJK + Latin in the same row. Off (default) follows the active
  // UI language for the first line. Session-only — not persisted; the user
  // can re-toggle each time they open the panel.
  const [showBoth, setShowBoth] = useState(false);

  const otherLang = lang === 'zh-TW' ? 'en' : 'zh-TW';
  const sample = showBoth
    ? `${FONT_SAMPLE_LINES[lang]}\n${FONT_SAMPLE_LINES[otherLang]}\n${FONT_SAMPLE_LINES.diff}`
    : `${FONT_SAMPLE_LINES[lang]}\n${FONT_SAMPLE_LINES.diff}`;

  return (
    <div className="section">
      <div className="row-spread">
        <span className="section-label">{t('font.label')}</span>
        <button
          type="button"
          className="btn"
          style={{ height: 28, fontSize: 12, padding: '0 10px' }}
          aria-pressed={showBoth}
          onClick={() => setShowBoth((v) => !v)}
        >
          {showBoth ? t('font.toggle.compact') : t('font.toggle.expand')}
        </button>
      </div>
      <div className="font-list" role="radiogroup" aria-label={t('font.label')}>
        {FONT_ORDER.map((id: FontId, idx) => {
          const f = FONTS[id];
          const selected = font === id;
          // Each row renders the sample at the user's current weight, clamped
          // to the font's wght axis. Lets the user compare typefaces while
          // still seeing the effect of the weight slider live.
          const sampleWeight = clampWeightForFont(id, fontWeight);
          // Insert a horizontal divider at the bundled → system boundary so
          // the curated set reads as a discrete group.
          const prevId = idx > 0 ? FONT_ORDER[idx - 1] : null;
          const showDivider =
            prevId !== null && FONTS[prevId].bundled && !f.bundled;
          return (
            <Fragment key={id}>
              {showDivider && <hr className="font-divider" aria-hidden />}
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                className={`font-row${selected ? ' selected' : ''}`}
                onClick={() => setFont(id)}
              >
                <span className="font-row-label">{t(f.labelKey)}</span>
                <span
                  className="font-row-sample"
                  style={{ fontFamily: f.family, fontWeight: sampleWeight }}
                >
                  {sample}
                </span>
              </button>
            </Fragment>
          );
        })}
      </div>
      <span className="muted">{t('font.note')}</span>
    </div>
  );
}
