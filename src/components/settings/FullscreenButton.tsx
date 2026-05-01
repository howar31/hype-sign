import { useT } from '../../lib/i18n';
import { useFullscreen } from '../../hooks/useFullscreen';

export function FullscreenButton() {
  const { isFullscreen, toggle, supported } = useFullscreen();
  const t = useT();

  if (!supported) return null;

  return (
    <button type="button" className="btn" onClick={toggle}>
      {isFullscreen ? `▣ ${t('fullscreen.exit')}` : `▢ ${t('fullscreen.enter')}`}
    </button>
  );
}
