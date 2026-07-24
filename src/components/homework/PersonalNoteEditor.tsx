import { useState } from 'react';
import { NotebookPen, Check, Loader2 } from 'lucide-react';
import { updateNote } from '../../services/notes.service';

interface Props {
  noteId: string;
  initial: string;
}

export const PersonalNoteEditor = ({ noteId, initial }: Props) => {
  const [text, setText] = useState(initial);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const dirty = text !== initial;

  const save = async () => {
    setState('saving');
    try {
      await updateNote(noteId, { personalNote: text });
      setState('saved');
    } catch {
      setState('error');
    }
  };

  return (
    <section className="rounded-2xl border border-navy/12 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <NotebookPen className="size-4 text-gold" />
        <h3 className="text-sm font-semibold text-navy">Ghi chú của tôi</h3>
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setState('idle');
        }}
        rows={3}
        placeholder="Ghi lại điều cần nhớ ở bài này (vd: dễ nhầm dấu khi chuyển vế)…"
        className="w-full resize-y rounded-xl border border-navy/12 bg-cream-light/40 px-3 py-2 text-sm text-navy outline-none focus:border-gold"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        {state === 'error' && <span className="text-xs text-burgundy">Lưu chưa được, thử lại.</span>}
        <button
          type="button"
          onClick={save}
          disabled={!dirty || state === 'saving'}
          className="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-cream transition enabled:cursor-pointer disabled:opacity-40"
        >
          {state === 'saving' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : state === 'saved' && !dirty ? (
            <Check className="size-3.5" />
          ) : null}
          {state === 'saved' && !dirty ? 'Đã lưu' : 'Lưu ghi chú'}
        </button>
      </div>
    </section>
  );
};
