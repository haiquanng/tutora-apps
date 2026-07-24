import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TriangleAlert, ArrowLeft } from 'lucide-react';
import { CanvasPanel } from '../components/homework/CanvasPanel';
import { PersonalNoteEditor } from '../components/homework/PersonalNoteEditor';
import { Skeleton } from '../components/ui/Skeleton';
import { getNote, type QuestionNote } from '../services/notes.service';

export const NotePage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<QuestionNote | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!noteId) return;
    setState('loading');
    getNote(noteId)
      .then((n) => {
        setNote(n);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [noteId]);

  if (state === 'loading') {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (state === 'error' || !note) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <TriangleAlert className="size-10 text-navy/20" />
        <h2 className="mt-4 font-serif text-xl font-semibold">Không mở được note</h2>
        <p className="mt-1 text-navy/50">Note không tồn tại hoặc đã bị xoá.</p>
        <button
          type="button"
          onClick={() => navigate('/notes')}
          className="mt-4 cursor-pointer rounded-xl bg-navy px-4 py-2 text-sm font-medium text-cream"
        >
          Về danh sách Note
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-navy/8 bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-navy/60 transition hover:bg-cream-light hover:text-navy"
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </button>
        <span className="truncate text-sm font-semibold text-navy">📌 {note.title}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
          {/* Ghi chú cá nhân — sửa được, lưu riêng qua PUT /question-notes/:id. */}
          <PersonalNoteEditor noteId={note.noteId} initial={note.personalNote ?? ''} />

          {/* Snapshot lời giải trong canvas (read-only). */}
          <div className="overflow-hidden rounded-2xl border border-navy/12">
            <div className="h-[70vh]">
              {note.solutionSteps?.length ? (
                <CanvasPanel title={note.title} steps={note.solutionSteps} onClose={() => navigate(-1)} />
              ) : (
                <p className="p-6 text-center text-navy/50">Note này chưa có lời giải từng bước được lưu.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
