import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Clock, ImageIcon, Trash2, Type } from 'lucide-react';
import { clearHistory, getHistory, removeHistoryItem } from '../services/history.service';
import type { SubmitMode } from '../types/solve';

const MODE_ICON: Record<SubmitMode, typeof Type> = {
  text: Type,
  image: ImageIcon,
  camera: Camera,
};

const formatTime = (ts: number) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(ts);

export const HistoryPage = () => {
  const [items, setItems] = useState(getHistory);
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <Clock className="size-10 text-navy/20" />
        <h2 className="mt-4 font-serif text-xl font-semibold">Chưa có bài nào</h2>
        <p className="mt-1 text-navy/50">Các bài bạn đã hỏi sẽ xuất hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Lịch sử</h1>
        <button
          type="button"
          onClick={() => setItems(clearHistory())}
          className="cursor-pointer text-sm font-medium text-navy/50 transition hover:text-burgundy"
        >
          Xoá tất cả
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = MODE_ICON[item.mode];
          return (
            <li key={item.id}>
              <div className="group flex items-center gap-3 rounded-2xl border border-navy/10 bg-white p-3 transition hover:border-gold">
                <button
                  type="button"
                  onClick={() => navigate(`/c/${item.id}`)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                >
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cream-light">
                      <Icon className="size-5 text-navy/40" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-navy">{item.question}</span>
                    <span className="block text-xs text-navy/40">{formatTime(item.createdAt)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setItems(removeHistoryItem(item.id))}
                  className="cursor-pointer rounded-lg p-2 text-navy/30 opacity-0 transition hover:text-burgundy group-hover:opacity-100"
                  aria-label="Xoá bài này"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
