import { useEffect, useState } from 'react';

// Returns true once the requested font/weight combination has loaded for
// the given sample text. Used by the display components so SVG getBBox()
// re-runs after a bundled web font finishes downloading — otherwise the
// initial measurement reflects a fallback font and the viewBox is wrong.
//
// For system fonts (no @font-face) the document.fonts.load promise resolves
// immediately; the hook still flips state to trigger re-measurement on
// font-family changes.
export function useFontReady(family: string, sample: string, weight: number): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (typeof document === 'undefined' || !document.fonts) {
      setReady(true);
      return;
    }
    let cancelled = false;
    document.fonts
      .load(`${weight} 100px ${family}`, sample || ' ')
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [family, sample, weight]);

  return ready;
}
