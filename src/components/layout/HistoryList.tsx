import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Trash2, ImageIcon } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { HistoryItem } from '../../types/solve';

interface Props {
  items: HistoryItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onNavigate?: () => void;
}

const DAY = 86_400_000;

const groupByTime = (items: HistoryItem[]) => {
  const now = Date.now();
  const buckets: { label: string; items: HistoryItem[] }[] = [
    { label: 'Hôm nay', items: [] },
    { label: '7 ngày qua', items: [] },
    { label: 'Cũ hơn', items: [] },
  ];
  for (const it of [...items].sort((a, b) => b.createdAt - a.createdAt)) {
    const age = now - it.createdAt;
    if (age < DAY) buckets[0].items.push(it);
    else if (age < 7 * DAY) buckets[1].items.push(it);
    else buckets[2].items.push(it);
  }
  return buckets.filter((b) => b.items.length);
};

/** Danh sách phiên hỏi bài (lịch sử chat) trên sidebar — click mở lại cuộc hỏi ở /c/:id. */
export const HistoryList = ({ items, isLoading, onDelete, onNavigate }: Props) => {
  const groups = useMemo(() => groupByTime(items), [items]);
  // Xoá LUÔN qua modal xác nhận (không xoá thẳng).
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-1.5 px-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-cream-light/70" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="px-3 py-2 text-[13px] leading-relaxed text-navy/35">Chưa có bài nào. Hỏi một bài để bắt đầu.</p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-navy/35">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.id} className="group/item relative">
                <NavLink
                  to={`/c/${item.id}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg py-2 pl-3 pr-8 text-[13.5px] transition ${
                      isActive ? 'bg-cream-light font-medium text-navy' : 'text-navy/70 hover:bg-cream-light/60'
                    }`
                  }
                  title={item.question}
                >
                  {item.thumbnail && <ImageIcon className="size-3.5 shrink-0 text-navy/30" />}
                  <span className="truncate">{item.question}</span>
                </NavLink>
                <button
                  type="button"
                  onClick={() => setPendingDelete(item.id)}
                  aria-label="Xoá bài này"
                  className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-navy/30 opacity-0 transition hover:bg-white hover:text-burgundy group-hover/item:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <ConfirmDialog
        open={pendingDelete !== null}
        danger
        title="Xoá bài này?"
        message="Bài này sẽ bị xoá khỏi lịch sử và không khôi phục được."
        confirmLabel="Xoá"
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
