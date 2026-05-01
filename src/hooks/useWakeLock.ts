import { useEffect, useRef } from 'react';

type WakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', cb: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinel>;
  };
};

/**
 * Requests a screen wake lock for the lifetime of the component (and
 * re-acquires it when the page becomes visible again, since browsers drop
 * the lock on tab background).
 */
export function useWakeLock(active = true) {
  const sentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;

    const nav = navigator as WakeLockNavigator;
    if (!nav.wakeLock) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request('screen');
        if (cancelled) {
          await s.release().catch(() => {});
          return;
        }
        sentinel.current = s;
        s.addEventListener('release', () => {
          sentinel.current = null;
        });
      } catch {
        // Battery saver / permission denied — fail silently.
      }
    };

    void acquire();

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinel.current) {
        void acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (sentinel.current) {
        void sentinel.current.release().catch(() => {});
        sentinel.current = null;
      }
    };
  }, [active]);
}
