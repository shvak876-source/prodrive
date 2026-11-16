import { forwardRef, useImperativeHandle, useRef } from "react";

export interface OdometerHandle {
  /** Sets the displayed value; each digit wheel rolls to its new position (CSS transform only). */
  set: (value: number) => void;
}

/**
 * Mechanical odometer: one vertical strip of 0–9 per digit, translated to the current digit.
 * Fixed number of digits so the layout never shifts; thousands separators are static.
 */
export const Odometer = forwardRef<OdometerHandle, { digits: number; initial: number; prefix?: string; label: string }>(
  function Odometer({ digits, initial, prefix = "", label }, ref) {
    const wheels = useRef<(HTMLSpanElement | null)[]>([]);
    const live = useRef<HTMLSpanElement>(null);
    const toDigits = (v: number) => String(Math.max(0, Math.round(v))).padStart(digits, "0").slice(-digits).split("").map(Number);

    useImperativeHandle(ref, () => ({
      set(value) {
        const d = toDigits(value);
        d.forEach((n, i) => {
          const w = wheels.current[i];
          if (w) w.style.transform = `translateY(${-n * 10}%)`;
        });
        if (live.current) live.current.textContent = `${prefix}${Math.round(value).toLocaleString("en-US")}`;
      },
    }));

    const init = toDigits(initial);
    return (
      <span className="odo" dir="ltr">
        <span className="sr-only" aria-live="polite" ref={live}>
          {label} {prefix}
          {initial.toLocaleString("en-US")}
        </span>
        <span aria-hidden="true" className="odo-row">
          {prefix && <span className="odo-sep">{prefix}</span>}
          {init.map((n, i) => {
            const fromEnd = digits - i;
            return (
              <span key={i} className="odo-slot">
                <span className="odo-win">
                  <span className="odo-wheel" ref={(el) => { wheels.current[i] = el; }} style={{ transform: `translateY(${-n * 10}%)` }}>
                    {Array.from({ length: 10 }, (_, k) => (
                      <span key={k}>{k}</span>
                    ))}
                  </span>
                </span>
                {fromEnd > 1 && fromEnd % 3 === 1 && <span className="odo-sep">,</span>}
              </span>
            );
          })}
        </span>
      </span>
    );
  },
);
