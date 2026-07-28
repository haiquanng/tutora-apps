import { useEffect, useRef, useState } from 'react';
import { NotebookPen, Trash2 } from 'lucide-react';
import { StepCard } from '../homework/StepCard';
import type { SolutionStep } from '../../types/solve';

interface Props {
  steps: SolutionStep[];
  stepNotes: Record<string, string>;
  onChange: (next: Record<string, string>) => Promise<unknown>;
}

export const NoteStepList = ({ steps, stepNotes, onChange }: Props) => {
  const [drafts, setDrafts] = useState<Record<string, string>>(stepNotes);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDrafts(stepNotes), [stepNotes]);

  useEffect(() => {
    if (openIndex !== null) areaRef.current?.focus();
  }, [openIndex]);

  const commit = (index: number) => {
    setOpenIndex(null);
    const key = String(index);
    const value = (drafts[key] ?? '').trim();
    const next = { ...stepNotes };
    if (value) next[key] = value;
    else delete next[key];

    // Không đổi thì khỏi gọi API.
    if (JSON.stringify(next) === JSON.stringify(stepNotes)) return;
    void onChange(next).catch(() => setDrafts(stepNotes));
  };

  const remove = (index: number) => {
    const next = { ...stepNotes };
    delete next[String(index)];
    setDrafts(next);
    void onChange(next).catch(() => setDrafts(stepNotes));
  };

  return (
    <div className="space-y-5">
      {steps.map((step, i) => {
        const key = String(i);
        const saved = stepNotes[key];
        const isOpen = openIndex === i;

        return (
          <div key={i}>
            <StepCard step={step} last />

            {isOpen ? (
              <textarea
                ref={areaRef}
                value={drafts[key] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                onBlur={() => commit(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setDrafts(stepNotes);
                    setOpenIndex(null);
                  }
                }}
                rows={2}
                placeholder="Ghi điều cần nhớ ở bước này…"
                className="mt-2 w-full resize-y rounded-xl border border-gold bg-white px-3 py-2 text-sm text-navy outline-none"
              />
            ) : saved ? (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/8 px-3 py-2">
                <NotebookPen className="mt-0.5 size-3.5 shrink-0 text-burgundy" />
                <button
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className="min-w-0 flex-1 cursor-pointer text-left text-sm leading-relaxed text-navy/80"
                >
                  {saved}
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Xoá ghi chú bước này"
                  className="shrink-0 cursor-pointer rounded-md p-1 text-navy/30 transition hover:bg-white hover:text-burgundy"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                className="mt-2 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-navy/35 transition hover:bg-cream-light hover:text-navy/70"
              >
                <NotebookPen className="size-3.5" />
                Thêm ghi chú cho bước này
              </button>
            )}

            {i < steps.length - 1 && <div className="mt-5 border-b border-navy/8" />}
          </div>
        );
      })}
    </div>
  );
};
