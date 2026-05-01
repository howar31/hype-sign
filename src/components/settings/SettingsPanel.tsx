import { useEffect } from 'react';
import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import { useWakeLock } from '../../hooks/useWakeLock';
import { TextInput } from './TextInput';
import { ModeToggle } from './ModeToggle';
import { SpeedSlider } from './SpeedSlider';
import { RotateButton } from './RotateButton';
import { LanguageToggle } from './LanguageToggle';
import { FullscreenButton } from './FullscreenButton';
import { ResetButton } from './ResetButton';
import { ColorEditor } from './color/ColorEditor';
import { PresetManager } from './presets/PresetManager';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsPanel({ open, onClose }: Props) {
  const t = useT();
  const mode = useSettings((s) => s.mode);
  const textColor = useSettings((s) => s.textColor);
  const bgColor = useSettings((s) => s.bgColor);
  const setTextColor = useSettings((s) => s.setTextColor);
  const setBgColor = useSettings((s) => s.setBgColor);

  // Keep screen awake whenever the app is visible.
  useWakeLock(true);

  // Close on Escape
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

        <div className="drawer-body">
          <TextInput />
          <ModeToggle />
          {mode === 'marquee' && <SpeedSlider />}

          <ColorEditor
            label={t('color.text')}
            value={textColor}
            onChange={setTextColor}
            defaultSolid="#ffffff"
          />
          <ColorEditor
            label={t('color.bg')}
            value={bgColor}
            onChange={setBgColor}
            defaultSolid="#000000"
          />

          <PresetManager />

          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <RotateButton />
            <FullscreenButton />
          </div>

          <LanguageToggle />
          <ResetButton />
        </div>
      </aside>
    </>
  );
}
