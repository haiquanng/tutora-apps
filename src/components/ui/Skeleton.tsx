interface Props {
  className?: string;
}

export const Skeleton = ({ className = '' }: Props) => (
  <div aria-hidden className={`animate-pulse rounded-md bg-navy/10 ${className}`} />
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);
