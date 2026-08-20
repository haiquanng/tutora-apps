import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flag, Loader2, Send } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { AttemptInProgress } from '../../services/assessment.service';

const pad = (n: number) => String(n).padStart(2, '0');

const formatLeft = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export interface SubmitAnswer {
  questionId: string;
  givenAnswer: string | null;
  timeSpentSeconds?: number;
}

/**
 * Phòng thi: 1 câu / 1 màn, panel trái điều hướng + timer, KHÔNG sidebar app.
 *
 * Chỉ vùng câu hỏi cuộn (overflow-y-auto), khung ngoài h-screen overflow-hidden —
 * panel trái và thanh điều hướng luôn thấy, không bị kéo đi.
 */
export const ExamRunner = ({
  attempt,
  onSubmit,
  isSubmitting,
}: {
  attempt: AttemptInProgress;
  onSubmit: (answers: SubmitAnswer[]) => void;
  isSubmitting: boolean;
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Tiếp tục bài dở: nạp lại đáp án đã lưu.
    const initial: Record<string, string> = {};
    attempt.questions.forEach((q) => {
      if (q.givenAnswer) initial[q.id] = q.givenAnswer;
    });
    return initial;
  });
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const startedRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const questions = attempt.questions;
  const total = questions.length;
  const current = questions[index];

  const expiresAt = useMemo(
    () => (attempt.expiresAt ? new Date(attempt.expiresAt).getTime() : null),
    [attempt.expiresAt],
  );

  const isAnswered = useCallback((id: string) => Boolean((answers[id] ?? '').trim()), [answers]);
  const answeredCount = questions.filter((q) => isAnswered(q.id)).length;

  const buildPayload = useCallback((): SubmitAnswer[] => {
    // Chia đều thời gian cả bài cho các câu đã trả lời — chưa track từng câu riêng.
    const elapsed = Math.max(0, Math.round((Date.now() - startedRef.current) / 1000));
    const per = answeredCount > 0 ? Math.round(elapsed / answeredCount) : undefined;

    return questions.map((q) => {
      const raw = (answers[q.id] ?? '').trim();
      return {
        questionId: q.id,
        // Rỗng -> null: BỎ TRỐNG, khác hẳn trả lời sai (AI phân biệt 2 ca này).
        givenAnswer: raw || null,
        timeSpentSeconds: raw ? per : undefined,
      };
    });
  }, [questions, answers, answeredCount]);

  const doSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    onSubmit(buildPayload());
  }, [buildPayload, onSubmit]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [expiresAt]);

  useEffect(() => {
    if (expiresAt && now >= expiresAt) doSubmit();
  }, [expiresAt, now, doSubmit]);

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.min(total - 1, Math.max(0, next)));
      // Câu dài -> về đầu vùng cuộn để không đọc giữa bài.
      scrollRef.current?.scrollTo({ top: 0 });
    },
    [total],
  );

  // Mũi tên trái/phải để chuyển câu — trừ lúc đang gõ trong input/textarea.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') goTo(index - 1);
      if (e.key === 'ArrowRight') goTo(index + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, goTo]);

  const toggleFlag = (id: string) =>
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const msLeft = expiresAt ? expiresAt - now : null;
  // Dưới 5 phút -> đổi màu nhắc, không popup chen ngang lúc đang làm.
  const urgent = msLeft !== null && msLeft <= 5 * 60 * 1000;
  const isLast = index === total - 1;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-cream">
      <header className="flex shrink-0 items-center gap-4 border-b border-navy/10 bg-white px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[17px] text-navy">{attempt.title}</p>
          <p className="mt-0.5 truncate text-xs text-navy">
            {[attempt.subjectName, attempt.gradeName].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isSubmitting}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Nộp bài
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Panel trái: lưới câu + timer dưới. Ẩn trên mobile, thay bằng thanh dưới. */}
        <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-navy/10 bg-white p-4 lg:flex">
          <div className="min-h-0 overflow-y-auto">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-navy">
              Câu hỏi ({answeredCount}/{total})
            </p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const done = isAnswered(q.id);
                const active = i === index;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={active}
                    className={`relative grid size-9 cursor-pointer place-items-center rounded-lg border text-[13px] font-semibold tabular-nums transition ${
                      active
                        ? 'border-navy bg-navy text-cream'
                        : done
                          ? 'border-gold bg-cream-light text-navy'
                          : 'border-navy/12 bg-white text-navy hover:border-gold/60'
                    }`}
                  >
                    {i + 1}
                    {flagged.has(q.id) && (
                      <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-burgundy" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-navy/8 pt-3 text-[11px] text-navy">
              <p className="flex items-center gap-1.5">
                <span className="size-2.5 rounded border border-gold bg-cream-light" />
                Đã trả lời
              </p>
              <p className="flex items-center gap-1.5">
                <span className="size-2.5 rounded border border-navy/15 bg-white" />
                Chưa làm
              </p>
              <p className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-burgundy" />
                Đã đánh dấu
              </p>
            </div>
          </div>

          {/* Timer nằm dưới panel như yêu cầu. */}
          {msLeft !== null && (
            <div
              className={`mt-4 shrink-0 rounded-xl border px-4 py-3 text-center ${
                urgent ? 'border-burgundy/30 bg-burgundy/5' : 'border-navy/10 bg-cream-light/50'
              }`}
            >
              <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy">
                <Clock className="size-3" />
                Thời gian còn lại
              </p>
              <p className={`mt-1 font-serif text-2xl tabular-nums ${urgent ? 'text-burgundy' : 'text-navy'}`}>
                {formatLeft(msLeft)}
              </p>
            </div>
          )}
        </aside>

        {/* Vùng DUY NHẤT được cuộn. */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-8">
              {index === 0 && attempt.description && (
                <p className="mb-6 rounded-xl border border-navy/10 bg-white px-5 py-4 text-[15px] leading-relaxed text-navy">
                  {attempt.description}
                </p>
              )}

              {current && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-navy">
                      Câu {index + 1} / {total}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleFlag(current.id)}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition ${
                        flagged.has(current.id)
                          ? 'border-burgundy/35 bg-burgundy/8 text-burgundy'
                          : 'border-navy/12 text-navy hover:border-burgundy/40 hover:text-burgundy'
                      }`}
                    >
                      <Flag className="size-3.5" />
                      {flagged.has(current.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
                    </button>
                  </div>

                  <QuestionCard
                    question={current}
                    answer={answers[current.id] ?? null}
                    onChange={(value) => setAnswers((prev) => ({ ...prev, [current.id]: value }))}
                  />
                </>
              )}
            </div>
          </div>

          {/* Thanh điều hướng cố định dưới — mobile kèm timer + tiến độ. */}
          <div className="shrink-0 border-t border-navy/10 bg-white px-5 py-3">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                className="flex cursor-pointer items-center gap-1 rounded-xl border border-navy/12 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-cream-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Câu trước
              </button>

              <div className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-xs font-semibold tabular-nums text-navy lg:hidden">
                  {index + 1}/{total} · đã làm {answeredCount}
                </span>
                {msLeft !== null && (
                  <span
                    className={`text-sm font-semibold tabular-nums lg:hidden ${urgent ? 'text-burgundy' : 'text-navy'}`}
                  >
                    {formatLeft(msLeft)}
                  </span>
                )}
              </div>

              {isLast ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isSubmitting}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:brightness-105 disabled:opacity-50"
                >
                  <Send className="size-4" />
                  Nộp bài
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className="flex cursor-pointer items-center gap-1 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
                >
                  Câu sau
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Nộp bài đánh giá?"
        message={
          answeredCount < total
            ? `Bạn còn ${total - answeredCount} câu chưa trả lời. Câu bỏ trống vẫn được tính vào phân tích để AI biết bạn đang vướng ở đâu.`
            : 'Bạn đã trả lời hết các câu. AI sẽ phân tích và xây lộ trình học cho bạn.'
        }
        confirmLabel="Nộp bài"
        cancelLabel="Làm tiếp"
        onConfirm={() => {
          setConfirmOpen(false);
          doSubmit();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
