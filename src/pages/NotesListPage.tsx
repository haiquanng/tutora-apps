import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, ImageIcon, Search } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getNotes, deleteNote, type QuestionNote } from '../services/notes.service';

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

const ALL_CHAPTERS = '__all__';
const UNTAGGED = '__untagged__';

const humanize = (slug: string) => {
  const text = slug.replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : slug;
};

interface Props {
  /** Gọi sau khi xoá để sidebar/nơi khác đồng bộ nếu cần. */
  onNotesChange?: () => void;
}

/** Trang danh sách Note (/notes): list -> click mở detail /notes/:id. Giống trang Lịch sử. */
export const NotesListPage = ({ onNotesChange }: Props) => {
  const [notes, setNotes] = useState<QuestionNote[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState(ALL_CHAPTERS);
  const navigate = useNavigate();

  const chapterOptions = useMemo(() => {
    const counter = new Map<string, number>();
    for (const n of notes) {
      const key = n.chapter || UNTAGGED;
      counter.set(key, (counter.get(key) ?? 0) + 1);
    }
    const items = [...counter.entries()]
      .map(([key, count]) => ({
        key,
        // Không có tên đẹp thì de-slug tạm; tên chuẩn hiện ở trang chi tiết note.
        label: key === UNTAGGED ? 'Chưa phân loại' : humanize(key),
        count,
      }))
      .sort((a, b) => b.count - a.count);
    return [{ key: ALL_CHAPTERS, label: 'Tất cả', count: notes.length }, ...items];
  }, [notes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (chapter !== ALL_CHAPTERS && (n.chapter || UNTAGGED) !== chapter) return false;
      if (!q) return true;
      return `${n.title} ${n.problemText ?? ''}`.toLowerCase().includes(q);
    });
  }, [notes, query, chapter]);

  const load = useCallback(() => {
    setLoading(true);
    getNotes()
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const id = pendingDelete;
    setPendingDelete(null);
    setNotes((prev) => prev.filter((n) => n.noteId !== id));
    try {
      await deleteNote(id);
      onNotesChange?.();
    } catch {
      load();
    }
  }, [pendingDelete, load, onNotesChange]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-(--breakpoint-2xl) px-4 py-8">
        <h1 className="mb-6 font-serif text-2xl font-bold">Note của tôi</h1>
        <ul className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white p-3">
              <Skeleton className="size-12 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-24" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!notes.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <Bookmark className="size-10 text-navy/20" />
        <h2 className="mt-4 font-serif text-xl font-semibold">Chưa có note nào</h2>
        <p className="mt-1 text-navy/50">Mở lời giải từng bước rồi bấm “Lưu Note” để lưu lại đây.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-2xl) flex-1 overflow-y-auto px-4 py-8">
      <h1 className="mb-4 font-serif text-2xl font-bold">Note của tôi</h1>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề…"
            className="w-full rounded-xl border border-navy/12 bg-white py-2 pl-9 pr-3 text-sm text-navy outline-none transition placeholder:text-navy/35 focus:border-gold"
          />
        </div>

        {/* Lọc theo chương — nền cho việc gộp cheat sheet theo chương sau này. */}
        {chapterOptions.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {chapterOptions.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setChapter(c.key)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
                  chapter === c.key
                    ? 'border-gold bg-gold/10 text-burgundy'
                    : 'border-navy/12 text-navy/60 hover:border-gold hover:text-navy'
                }`}
              >
                {c.label}
                <span className="ml-1 text-navy/35">{c.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 && (
        <p className="rounded-2xl border border-navy/10 bg-white px-4 py-8 text-center text-sm text-navy/45">
          Không có note nào khớp.
        </p>
      )}

      <ul className="space-y-2">
        {visible.map((note) => (
          <li key={note.noteId}>
            <div className="group flex items-center gap-3 rounded-2xl border border-navy/10 bg-white p-3 transition hover:border-gold">
              <button
                type="button"
                onClick={() => navigate(`/notes/${note.noteId}`)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
              >
                {note.problemImageUrl ? (
                  <img src={note.problemImageUrl} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cream-light">
                    <ImageIcon className="size-5 text-navy/30" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-navy">{note.title}</span>
                  <span className="block truncate text-xs text-navy/40">
                    {[
                      note.chapter ? humanize(note.chapter) : null,
                      note.gradeLevel ? `Lớp ${note.gradeLevel}` : null,
                      formatTime(note.createdAt),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(note.noteId)}
                className="cursor-pointer rounded-lg p-2 text-navy/30 opacity-0 transition hover:text-burgundy group-hover:opacity-100"
                aria-label="Xoá note này"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        danger
        title="Xoá note này?"
        message="Note sẽ bị xoá và không khôi phục được."
        confirmLabel="Xoá"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
