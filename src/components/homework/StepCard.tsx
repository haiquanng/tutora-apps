import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Markdown } from './Markdown';
import type { SolutionStep } from '../../types/solve';

interface Props {
  step: SolutionStep;
  onAsk: (step: SolutionStep, question?: string) => void;
  disabled?: boolean;
}

/** 1 thẻ bước trên canvas: tiêu đề, diễn giải, công thức, và nút hỏi sâu thêm. */
export const StepCard = ({ step, onAsk, disabled }: Props) => {
  const [isOpen, setOpen] = useState(true);
  const [followUp, setFollowUp] = useState('');
  const [isAsking, setAsking] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-cream-light/50"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-burgundy text-sm font-semibold text-cream">
          {step.index + 1}
        </span>
        <h3 className="flex-1 font-serif text-base font-semibold text-navy">{step.title}</h3>
        <ChevronDown className={`size-4 shrink-0 text-navy/40 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="border-t border-navy/5 px-4 pb-4 pt-3">
          {step.explanation && <Markdown>{step.explanation}</Markdown>}

          {step.formulas.map((formula, i) => (
            <div key={i} className="my-3 overflow-x-auto rounded-xl bg-cream-light px-4 py-3">
              <Markdown>{`$$${formula}$$`}</Markdown>
            </div>
          ))}

          <div className="mt-4 border-t border-dashed border-navy/10 pt-3">
            {isAsking ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onAsk(step, followUp);
                      setFollowUp('');
                      setAsking(false);
                    }
                    if (e.key === 'Escape') setAsking(false);
                  }}
                  placeholder="Bạn chưa hiểu chỗ nào ở bước này?"
                  className="flex-1 rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none focus:border-gold"
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onAsk(step, followUp);
                    setFollowUp('');
                    setAsking(false);
                  }}
                  className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-cream enabled:cursor-pointer disabled:opacity-50"
                >
                  Hỏi
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onAsk(step)}
                  className="flex items-center gap-1.5 rounded-full bg-cream-light enabled:cursor-pointer px-3 py-1.5 text-xs font-medium text-navy/70 transition hover:text-navy disabled:opacity-50"
                >
                  <Sparkles className="size-3.5" />
                  Giải thích kỹ hơn
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setAsking(true)}
                  className="rounded-full bg-cream-light px-3 py-1.5 text-xs font-medium text-navy/70 transition enabled:cursor-pointer hover:text-navy disabled:opacity-50"
                >
                  Hỏi câu khác
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
