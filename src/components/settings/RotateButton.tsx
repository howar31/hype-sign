import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';

export function RotateButton() {
  const rotation = useSettings((s) => s.rotation);
  const cycle = useSettings((s) => s.cycleRotation);
  const t = useT();

  return (
    <button type="button" className="btn" onClick={cycle} aria-label={t('rotate.button')}>
      <span style={{ display: 'inline-block', transform: `rotate(${rotation}deg)`, transition: 'transform 200ms ease' }}>
        ⟳
      </span>
      <span>
        {t('rotate.button')} ({rotation}°)
      </span>
    </button>
  );
}
