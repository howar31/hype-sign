import { useCallback, useEffect, useState } from 'react';

export function useFullscreen() {
  const [isFs, setIsFs] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const handler = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const enter = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // iOS Safari and some browsers reject the request silently — ignore.
    }
  }, []);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    if (isFs) void exit();
    else void enter();
  }, [isFs, enter, exit]);

  const supported =
    typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function';

  return { isFullscreen: isFs, enter, exit, toggle, supported };
}
