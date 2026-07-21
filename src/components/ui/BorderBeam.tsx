import type { CSSProperties } from 'react';

interface Props {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  className?: string;
}

export const BorderBeam = ({
  size = 60,
  duration = 8,
  delay = 0,
  colorFrom = '#d4b483',
  colorTo = '#631b1b',
  borderWidth = 1.5,
  className = '',
}: Props) => (
  <div
    className="pointer-events-none absolute inset-0 rounded-[inherit] border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    style={{ borderWidth }}
  >
    <div
      className={`animate-border-beam absolute aspect-square bg-gradient-to-l from-[var(--beam-from)] via-[var(--beam-to)] to-transparent ${className}`}
      style={
        {
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          '--beam-from': colorFrom,
          '--beam-to': colorTo,
          '--beam-duration': duration,
          animationDelay: `${delay}s`,
        } as CSSProperties
      }
    />
  </div>
);
