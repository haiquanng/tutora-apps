import { useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  spotlightColor?: string;
  className?: string;
}

export const SpotlightCard = ({ children, spotlightColor = 'rgb(212 180 131 / 0.35)', className = '' }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      style={{ '--spotlight-color': spotlightColor } as React.CSSProperties}
      className={`spotlight-card relative overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};
