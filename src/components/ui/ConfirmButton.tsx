import { useEffect, useRef, useState } from 'react';

type Props = {
  /** Label shown when idle. */
  children: React.ReactNode;
  /** Label shown after first click; second click within timeout fires onConfirm. */
  confirmLabel: React.ReactNode;
  onConfirm: () => void;
  className?: string;
  style?: React.CSSProperties;
  timeoutMs?: number;
  disabled?: boolean;
  ariaLabel?: string;
};

export function ConfirmButton({
  children,
  confirmLabel,
  onConfirm,
  className,
  style,
  timeoutMs = 3000,
  disabled,
  ariaLabel,
}: Props) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function handleClick() {
    if (disabled) return;
    if (armed) {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      setArmed(false);
      onConfirm();
      return;
    }
    setArmed(true);
    timer.current = window.setTimeout(() => {
      setArmed(false);
      timer.current = null;
    }, timeoutMs);
  }

  const cls = ['btn', 'danger', armed ? 'armed' : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={cls}
      onClick={handleClick}
      disabled={disabled}
      style={style}
      aria-label={ariaLabel}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
