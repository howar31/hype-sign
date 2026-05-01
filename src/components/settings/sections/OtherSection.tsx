import { RotateButton } from '../RotateButton';
import { FullscreenButton } from '../FullscreenButton';
import { LanguageToggle } from '../LanguageToggle';

export function OtherSection() {
  return (
    <>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <RotateButton />
        <FullscreenButton />
      </div>
      <LanguageToggle />
    </>
  );
}
