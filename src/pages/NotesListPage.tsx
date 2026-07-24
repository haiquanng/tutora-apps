import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, ImageIcon } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getNotes, deleteNote, type QuestionNote } from '../services/notes.service';

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

interface Props {
  /** Gọi sau khi xoá để sidebar/nơi khác đồng bộ nếu cần. */
  onNotesChange?: () => void;
}

/** Trang danh sách Note (/notes): list -> click mở detail /notes/:id. Giống trang Lịch sử. */
export const NotesListPage = ({ onNotesChange }: Props) => {
  const [notes, setNotes] = useState<QuestionNote[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const navigate = useNavigate();

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
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
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
    <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-8">
      <h1 className="mb-6 font-serif text-2xl font-bold">Note của tôi</h1>

      <ul className="space-y-2">
        {notes.map((note) => (
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
                  <span className="block text-xs text-navy/40">
                    {[note.subject, note.gradeLevel ? `Lớp ${note.gradeLevel}` : null].filter(Boolean).join(' · ') ||
                      formatTime(note.createdAt)}
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
