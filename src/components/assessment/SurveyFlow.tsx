import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { useSubjects } from '../../hooks/useSubjects';
import type { Subject } from '../../services/lookup.service';

interface Option {
  value: string;
  label: string;
}

export interface SurveyAnswers {
  subjectId: number;
  /** Số lớp thật (9..12) — đổi sang gradeLevelId ở lớp gọi. */
  grade: number;
  goal: string;
  selfRating: string;
}

interface Step {
  key: keyof SurveyAnswers;
  question: string;
  hint?: string;
  options: Option[];
}

const GOALS: Option[] = [
  { value: 'mat_goc', label: 'Mình đang mất gốc, cần học lại từ đầu' },
  { value: 'cung_co', label: 'Củng cố kiến thức đang học trên lớp' },
  { value: 'nang_cao', label: 'Học nâng cao, luyện bài khó' },
  { value: 'on_thi', label: 'Ôn thi (giữa kỳ, cuối kỳ, tuyển sinh)' },
];

const SELF_RATING: Option[] = [
  { value: 'yeu', label: 'Chưa tự tin — hay không biết bắt đầu từ đâu' },
  { value: 'trung_binh', label: 'Bình thường — làm được bài cơ bản' },
  { value: 'kha', label: 'Khá — chỉ vướng bài vận dụng' },
  { value: 'tot', label: 'Tốt — muốn thử sức bài khó' },
];

const gradesOf = (subject: Subject | undefined): number[] => {
  if (!subject) return [9, 10, 11, 12];
  const set = new Set(subject.chapters.map((c) => c.grade).filter((g) => g > 0));
  // Môn chưa gắn chương -> vẫn cho chọn lớp, BE nới tiêu chí nếu không có đề đúng lớp.
  return set.size ? [...set].sort((a, b) => a - b) : [9, 10, 11, 12];
};

/**
 * Khảo sát đầu vào từng bước (1 câu / 1 màn). Kết quả dùng để CHỌN ĐỀ: bộ đề chưa có
 * cột cấp độ nên tiêu chí thật chỉ là môn + lớp, còn goal/selfRating thu trước để dành
 * cho lúc đề có phân cấp.
 */
export const SurveyFlow = ({
  onDone,
  onCancel,
  isStarting,
  error,
}: {
  onDone: (answers: SurveyAnswers) => void;
  onCancel: () => void;
  isStarting: boolean;
  error: string | null;
}) => {
  const { subjects, isLoading } = useSubjects();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>({});
  const [warning, setWarning] = useState<string | null>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  // Chỉ môn đã bật hỏi bài — môn khoá chưa có nội dung để đánh giá.
  const available = useMemo(() => subjects.filter((s) => !s.locked), [subjects]);
  const picked = available.find((s) => s.id === answers.subjectId);

  const steps: Step[] = useMemo(
    () => [
      {
        key: 'subjectId',
        question: 'Bạn muốn đánh giá môn nào?',
        hint: 'Chọn môn bạn muốn xây lộ trình học.',
        options: available.map((s) => ({ value: String(s.id), label: s.name })),
      },
      {
        key: 'grade',
        question: 'Bạn đang học lớp mấy?',
        hint: 'Đề đánh giá sẽ chọn theo đúng khối lớp của bạn.',
        options: gradesOf(picked).map((g) => ({ value: String(g), label: `Lớp ${g}` })),
      },
      { key: 'goal', question: 'Mục tiêu của bạn với môn này là gì?', options: GOALS },
      {
        key: 'selfRating',
        question: 'Bạn tự thấy mình đang ở mức nào?',
        hint: 'Trả lời thật lòng nhé — không có đáp án đúng/sai ở đây.',
        options: SELF_RATING,
      },
    ],
    [available, picked],
  );

  const step = steps[index];
  const total = steps.length;

  useEffect(() => {
    setWarning(null);
    headingRef.current?.focus();
  }, [index]);

  const pick = (value: string) => {
    setWarning(null);
    const next: Partial<SurveyAnswers> = { ...answers };

    if (step.key === 'subjectId') {
      const id = Number(value);
      // Đổi môn -> lớp cũ có thể không thuộc môn mới, bỏ để chọn lại.
      if (next.subjectId !== id) delete next.grade;
      next.subjectId = id;
    } else if (step.key === 'grade') {
      next.grade = Number(value);
    } else {
      next[step.key] = value;
    }
    setAnswers(next);

    if (index + 1 < total) {
      setIndex(index + 1);
      return;
    }

    if (!next.subjectId || !next.grade) {
      setWarning('Thiếu môn học hoặc khối lớp, bạn chọn lại giúp mình nhé.');
      return;
    }
    onDone(next as SurveyAnswers);
  };

  const selected = (): string | undefined => {
    const value = answers[step.key];
    return value === undefined ? undefined : String(value);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy/40" />
      </div>
    );
  }

  if (!available.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-serif text-2xl text-navy">Chưa có môn nào mở đánh giá</p>
        <p className="mt-3 text-[15px] text-navy">
          Hiện chưa có môn học nào bật tính năng đánh giá đầu vào. Bạn quay lại sau nhé.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-6 cursor-pointer rounded-xl border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-cream-light"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const current = selected();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-20">
      {/* Tiến độ theo bước, không hiện % để không tạo cảm giác đang bị chấm điểm. */}
      <div className="mb-10 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (index === 0 ? onCancel() : setIndex(index - 1))}
          disabled={isStarting}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-navy transition hover:bg-cream-light hover:text-navy disabled:opacity-40"
        >
          <ArrowLeft className="size-4" />
          {index === 0 ? 'Thoát' : 'Quay lại'}
        </button>
        <div className="flex flex-1 gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.key}
              className={`h-1 flex-1 rounded-full transition ${i <= index ? 'bg-gold' : 'bg-navy/10'}`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold tabular-nums text-navy">
          {index + 1}/{total}
        </span>
      </div>

      <div ref={headingRef} tabIndex={-1} aria-live="polite" className="outline-none">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold text-cream">
            {index + 1}
          </span>
          <div>
            <h1 className="font-serif text-2xl leading-snug text-navy sm:text-[28px]">{step.question}</h1>
            {step.hint && <p className="mt-2 text-[15px] text-navy">{step.hint}</p>}
          </div>
        </div>

        <div className="mt-8 space-y-2.5">
          {step.options.map((opt) => {
            const active = current === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isStarting}
                onClick={() => pick(opt.value)}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left text-[15px] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? 'border-gold bg-cream-light font-semibold text-navy'
                    : 'border-navy/10 bg-white text-navy hover:border-gold/60 hover:bg-cream-light/50'
                }`}
              >
                {opt.label}
                {active && isStarting && <Loader2 className="size-4 shrink-0 animate-spin text-navy/40" />}
              </button>
            );
          })}
        </div>

        {(warning || error) && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-burgundy/20 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{warning ?? error}</span>
          </div>
        )}

        {isStarting && <p className="mt-6 text-sm text-navy">Đang chọn đề phù hợp với bạn…</p>}
      </div>
    </div>
  );
};
