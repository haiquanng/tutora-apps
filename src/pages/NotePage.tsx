import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TriangleAlert, ArrowLeft } from 'lucide-react';
import { NoteHeaderEditor } from '../components/notes/NoteHeaderEditor';
import { NoteStepList } from '../components/notes/NoteStepList';
import { PersonalNoteEditor } from '../components/homework/PersonalNoteEditor';
import { Skeleton } from '../components/ui/Skeleton';
import { getNote, updateNote, type QuestionNote, type UpdateNotePayload } from '../services/notes.service';

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

  const save = useCallback(
    async (patch: UpdateNotePayload) => {
      if (!noteId) return;
      const updated = await updateNote(noteId, patch);
      setNote(updated);
    },
    [noteId],
  );

  if (state === 'loading') {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (state === 'error' || !note) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <TriangleAlert className="size-10 text-navy/20" />
        <h2 className="mt-4 font-serif text-xl font-semibold">Không mở được ghi chú</h2>
        <p className="mt-1 text-navy/50">Ghi chú không tồn tại hoặc đã bị xoá.</p>
        <button
          type="button"
          onClick={() => navigate('/notes')}
          className="mt-4 cursor-pointer rounded-xl bg-navy px-4 py-2 text-sm font-medium text-cream"
        >
          Về danh sách ghi chú
        </button>
      </div>
    );
  }

  const steps = note.solutionSteps ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-navy/8 bg-white px-4 py-2">
        <button
          type="button"
          onClick={() => navigate('/notes')}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-navy/60 transition hover:bg-cream-light hover:text-navy"
        >
          <ArrowLeft className="size-4" />
          Ghi chú của tôi
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
          <NoteHeaderEditor title={note.title} chapter={note.chapter} gradeLevel={note.gradeLevel} onSave={save} />

          <PersonalNoteEditor noteId={note.noteId} initial={note.personalNote ?? ''} />

          <section className="rounded-2xl border border-navy/12 bg-white p-4 sm:p-5">
            <h3 className="mb-4 text-sm font-semibold text-navy/70">Lời giải từng bước</h3>
            {steps.length ? (
              <NoteStepList
                steps={steps}
                stepNotes={note.stepNotes ?? {}}
                onChange={(stepNotes) => save({ stepNotes })}
              />
            ) : (
              <p className="py-6 text-center text-sm text-navy/45">Ghi chú này chưa có lời giải từng bước được lưu.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
