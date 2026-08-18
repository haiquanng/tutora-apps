import { Check } from 'lucide-react';
import { MathText } from '../ui/MathText';
import type { AttemptQuestion } from '../../services/assessment.service';

/** Đáp án nhiều lựa chọn lưu dạng CSV key — dùng chung multi_choice và true_false. */
export const parseKeys = (raw: string | null): string[] =>
  raw
    ? raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

const toggleKey = (raw: string | null, key: string): string => {
  const keys = parseKeys(raw);
  const next = keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
  return next.sort().join(',');
};

const FORMAT_HINT: Record<string, string> = {
  single_choice: 'Chọn 1 đáp án',
  multi_choice: 'Chọn nhiều đáp án',
  true_false: 'Tick các mệnh đề ĐÚNG',
  short_answer: 'Nhập đáp án',
  essay: 'Trình bày bài làm',
};

export const QuestionCard = ({
  question,
  answer,
  onChange,
}: {
  question: AttemptQuestion;
  answer: string | null;
  onChange: (value: string) => void;
}) => {
  const { questionFormat: format, answerOptions: options } = question;
  const selectedKeys = parseKeys(answer);
  const isChoice = format === 'single_choice' || format === 'multi_choice' || format === 'true_false';

  return (
    <div className="pt-4">
      <div>
        <div className="min-w-0 flex-1">
          <div className="text-[19px] leading-relaxed text-navy">
            <MathText>{question.content}</MathText>
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-navy/40">
            {FORMAT_HINT[format] ?? 'Trả lời'}
          </p>

          {question.imageUrls.map((url) => (
            <img key={url} src={url} alt="" className="mt-4 max-h-72 rounded-xl border border-navy/10 object-contain" />
          ))}

          <div className="mt-5">
            {isChoice && options && (
              <div className="space-y-2.5">
                {options.map((opt) => {
                  const active = format === 'single_choice' ? answer === opt.key : selectedKeys.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => onChange(format === 'single_choice' ? opt.key : toggleKey(answer, opt.key))}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-gold bg-cream-light'
                          : 'border-navy/10 bg-white hover:border-gold/60 hover:bg-cream-light/50'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center text-[11px] font-bold transition ${
                          // Chọn 1 -> tròn; chọn nhiều/đúng-sai -> vuông.
                          format === 'single_choice' ? 'rounded-full' : 'rounded'
                        } ${active ? 'bg-navy text-cream' : 'border border-navy/25 text-navy/50'}`}
                      >
                        {active ? <Check className="size-3" /> : opt.key}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] leading-relaxed text-navy/85">
                        <MathText>{opt.text}</MathText>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {format === 'short_answer' && (
              <input
                type="text"
                value={answer ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Nhập đáp án của bạn…"
                className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-[15px] text-navy outline-none transition placeholder:text-navy/35 focus:border-gold"
              />
            )}

            {format === 'essay' && (
              <textarea
                value={answer ?? ''}
                onChange={(e) => onChange(e.target.value)}
                rows={6}
                placeholder="Trình bày bài làm của bạn…"
                className="w-full resize-y rounded-xl border border-navy/15 bg-white px-4 py-3 text-[15px] leading-relaxed text-navy outline-none transition placeholder:text-navy/35 focus:border-gold"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
