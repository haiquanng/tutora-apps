import { useId } from 'react';

interface Props {
  gap?: number;
  radius?: number;
  className?: string;
}

export const DotPattern = ({ gap = 16, radius = 1, className = '' }: Props) => {
  const id = useId();

  return (
    <svg aria-hidden className={`pointer-events-none absolute inset-0 size-full ${className}`}>
      <defs>
        <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={radius} cy={radius} r={radius} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};
