import { useState } from 'react';
import { Check, ChevronDown, Minus, X } from 'lucide-react';
import { MathText } from '../ui/MathText';
import type { AttemptAnswerResult } from '../../services/assessment.service';

const DIFFICULTY_VI: Record<string, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
};

/** Tự luận BE không auto-chấm -> không gắn dấu đúng/sai, chỉ hiện đáp án mẫu. */
const isEssay = (a: AttemptAnswerResult) => a.questionFormat === 'essay';

const StatusIcon = ({ answer }: { answer: AttemptAnswerResult }) => {
  if (isEssay(answer)) {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full border border-navy/20 text-navy/40">
        <Minus className="size-3" />
      </span>
    );
  }
  if (answer.isCorrect) {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest text-cream">
        <Check className="size-3" />
      </span>
    );
  }
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-burgundy text-cream">
      <X className="size-3" />
    </span>
  );
};

/**
 * Xem lại từng câu. Đáp án LUÔN hiện — showResult chỉ gác phần điểm, không gác đáp án.
 */
export const AnswerReview = ({ answers }: { answers: AttemptAnswerResult[] }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="divide-y divide-navy/8 overflow-hidden rounded-2xl border border-navy/10 bg-white">
      {answers.map((a) => {
        const open = openId === a.questionId;
        const skipped = !a.givenAnswer;

        return (
          <li key={a.questionId}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : a.questionId)}
              className="flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left transition hover:bg-cream-light/40"
            >
              <StatusIcon answer={a} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[15px] leading-relaxed text-navy">
                  <span className="font-semibold">Câu {a.displayOrder}. </span>
                  <MathText>{a.content}</MathText>
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-navy/45">
                  {a.chapterName && <span>{a.chapterName}</span>}
                  {a.difficulty && <span>· {DIFFICULTY_VI[a.difficulty] ?? a.difficulty}</span>}
                  {skipped && <span className="font-semibold text-navy/60">· Bỏ trống</span>}
                </p>
              </div>
              <ChevronDown className={`mt-0.5 size-4 shrink-0 text-navy/30 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="space-y-3 border-t border-navy/8 bg-cream-light/30 px-5 py-4 pl-13">
                {a.answerOptions?.length ? (
                  <ul className="space-y-1.5">
                    {a.answerOptions.map((opt) => (
                      <li key={opt.key} className="flex gap-2 text-[14px] text-navy/70">
                        <span className="font-semibold text-navy/50">{opt.key}.</span>
                        <MathText>{opt.text}</MathText>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <p className="text-[14px] text-navy/70">
                    <span className="font-semibold text-navy">Bạn trả lời: </span>
                    {skipped ? (
                      <span className="italic text-navy/45">không trả lời</span>
                    ) : (
                      <MathText>{a.givenAnswer!}</MathText>
                    )}
                  </p>
                  {a.correctAnswer && (
                    <p className="text-[14px] text-navy/70">
                      <span className="font-semibold text-forest">Đáp án: </span>
                      <MathText>{a.correctAnswer}</MathText>
                    </p>
                  )}
                </div>

                {a.explanation && (
                  <div className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] leading-relaxed text-navy/75">
                    <MathText>{a.explanation}</MathText>
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
