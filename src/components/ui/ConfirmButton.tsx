import { useEffect, useRef, useState } from 'react';

type Variant = 'danger' | 'neutral';

type Props = {
  /** Label shown when idle. */
  children: React.ReactNode;
  /** Label shown after first click; second click within timeout fires onConfirm. */
  confirmLabel: React.ReactNode;
  onConfirm: () => void;
  /**
   * Visual variant:
   * - "danger" (default) — red border / red armed state. Use for destructive
   *   actions (reset, delete, clear).
   * - "neutral" — plain button border / blue armed state. Use for non-
   *   destructive but irreversible-feeling actions (apply preset).
   */
  variant?: Variant;
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
  variant = 'danger',
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

  const cls = [
    'btn',
    variant === 'danger' ? 'danger' : '',
    armed ? 'armed' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

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
