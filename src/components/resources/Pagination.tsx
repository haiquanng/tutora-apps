import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const buildPages = (current: number, total: number): number[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: number[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push(-1);
    result.push(p);
    prev = p;
  }
  return result;
};

export const Pagination = ({ currentPage, totalPages, onChange }: Props) => {
  if (totalPages <= 1) return null;

  const circle =
    'grid size-10 cursor-pointer place-items-center rounded-full border text-sm transition disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav className="mt-8 flex items-center justify-end gap-2" aria-label="Phân trang">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
        aria-label="Trang trước"
        className={`${circle} border-navy/15 text-navy/60 hover:border-navy/30 hover:text-navy`}
      >
        <ChevronLeft className="size-4" />
      </button>

      {buildPages(currentPage, totalPages).map((p, i) =>
        p === -1 ? (
          <span key={`gap-${i}`} className="grid size-10 place-items-center text-navy/40">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === currentPage}
            onClick={() => onChange(p)}
            className={`${circle} ${
              p === currentPage
                ? 'border-navy bg-navy font-semibold text-white'
                : 'border-navy/15 text-navy/70 hover:border-navy/30 hover:text-navy'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onChange(currentPage + 1)}
        aria-label="Trang sau"
        className={`${circle} border-navy/15 text-navy/60 hover:border-navy/30 hover:text-navy`}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
};
