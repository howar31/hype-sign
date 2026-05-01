import { useEffect, useState } from 'react';
import type { ColorValue } from '../../../types';

type Props = {
  type: ColorValue['type'];
  size?: number;
  /** Tooltip label (already localised). Required so the icon explains itself. */
  label: string;
};

/**
 * Tiny abstract glyph indicating a color preset's type. Placed next to
 * the actual color swatch so the type is readable at a glance even when
 * a multi-stop gradient is rendered too small to tell apart from a
 * solid in the preview.
 *
 * Tooltip behavior — desktop hover via CSS :hover; touch via tap which
 * sets a state class that holds the tooltip for ~2s before fading.
 */
export function ColorTypeIcon({ type, size = 14, label }: Props) {
  const stroke = 'currentColor';
  const sw = 1.5;
  const [tapShown, setTapShown] = useState(false);

  useEffect(() => {
    if (!tapShown) return;
    const id = window.setTimeout(() => setTapShown(false), 2000);
    return () => window.clearTimeout(id);
  }, [tapShown]);

  function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    setTapShown(true);
  }

  let glyph: React.ReactNode;
  if (type === 'solid') {
    glyph = <rect x="3" y="3" width="10" height="10" rx="2.5" fill={stroke} />;
  } else if (type === 'linear') {
    glyph = (
      <>
        <rect x="3" y="3" width="10" height="10" rx="2.5" fill="none" stroke={stroke} strokeWidth={sw} />
        <line x1="4" y1="12" x2="12" y2="4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </>
    );
  } else {
    // radial
    glyph = (
      <>
        <circle cx="8" cy="8" r="5" fill="none" stroke={stroke} strokeWidth={sw} />
        <circle cx="8" cy="8" r="2" fill={stroke} />
      </>
    );
  }

  return (
    <span
      className={`type-icon-wrapper${tapShown ? ' show-tip' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
        {glyph}
      </svg>
      <span className="type-tooltip" role="tooltip">
        {label}
      </span>
    </span>
  );
}
