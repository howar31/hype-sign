import { RotateButton } from '../RotateButton';
import { FullscreenButton } from '../FullscreenButton';
import { LanguageToggle } from '../LanguageToggle';
import { MarginSlider } from '../MarginSlider';
import { useT } from '../../../lib/i18n';
import { useUpdateReady } from '../../../lib/swUpdate';

export function OtherSection() {
  const t = useT();
  const updateReady = useUpdateReady();
  return (
    <>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <RotateButton />
        <FullscreenButton />
      </div>
      <MarginSlider />
      <LanguageToggle />
      <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        {t('version.label')}: {__COMMIT__}
        {updateReady ? ` · ${t('version.updateReady')}` : ''}
      </div>
    </>
  );
}
