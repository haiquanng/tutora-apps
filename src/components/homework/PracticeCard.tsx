import { useState } from 'react';
import { toast } from 'sonner';
import { Dumbbell, ExternalLink, Loader2 } from 'lucide-react';
import { MathText } from '../ui/MathText';
import { Markdown } from './Markdown';
import { fetchNextPractice } from '../../services/practice.service';
// import { submitPractice } from '../../services/practice.service';
import type { PracticeQuestion } from '../../services/practice.service';
// import type { SelfAssessment } from '../../services/practice.service';

const DIFFICULTY_VI: Record<string, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
};

// Bỏ bước tự chấm: xem lời giải xong là đủ, hỏi thêm chỉ làm dài luồng.
// const SELF_OPTIONS: { key: SelfAssessment; label: string; className: string }[] = [
//   { key: 'correct', label: 'Em giải được', className: 'border-emerald-600/40 text-emerald-700 hover:bg-emerald-50' },
//   { key: 'wrong', label: 'Chưa giải được', className: 'border-burgundy/40 text-burgundy hover:bg-burgundy/5' },
// ];

interface Props {
  /** Chương của bài vừa giải. */
  chapter: string;
  /** Đề bài vừa hỏi — BE dùng embedding tìm bài CÙNG DẠNG, không chỉ cùng chương. */
  questionText?: string;
  sessionId?: string;
}

/**
 * Mời luyện 1 câu TỰ LUẬN cùng chương sau khi giải xong.
 */
// sessionId chỉ phục vụ submitPractice — giữ trong Props, bỏ destructure cho hết unused.
// export const PracticeCard = ({ chapter, questionText, sessionId }: Props) => {
export const PracticeCard = ({ chapter, questionText }: Props) => {
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  // const [isAssessed, setAssessed] = useState(false);
  const [isLoading, setLoading] = useState(false);

  // Hết bài / lỗi mạng đều KHÔNG ẩn thẻ: báo toast rồi để nguyên nút, học sinh
  // bấm lại được. Ẩn đi khiến nút tự dưng biến mất, không hiểu vì sao.
  const start = async () => {
    setLoading(true);
    try {
      const q = await fetchNextPractice({ chapter, questionText });
      if (q) setQuestion(q);
      else toast.info('Dạng bài này chưa có bài tương tự trên hệ thống.');
    } catch {
      toast.error('Không tải được bài luyện tập. Bạn thử lại nhé.');
    } finally {
      setLoading(false);
    }
  };

  // const assess = async (selfAssessment: SelfAssessment) => {
  //   if (!question) return;
  //   setLoading(true);
  //   try {
  //     await submitPractice({ questionId: question.questionId, selfAssessment, sourceSessionId: sessionId });
  //     setAssessed(true);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const next = () => {
    setQuestion(null);
    setShowSolution(false);
    // setAssessed(false);
    void start();
  };

  if (!question) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={isLoading}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-navy/12 bg-white px-4 py-3 text-left text-sm transition hover:border-gold hover:bg-gold/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-burgundy" />
        ) : (
          <Dumbbell className="size-4 shrink-0 text-burgundy" />
        )}
        <span className="flex-1 text-navy">
          <span className="font-semibold">Thử một bài tương tự?</span> Mở xem đáp án sau khi làm xong.
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-navy/12 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-navy">
        <Dumbbell className="size-3.5 text-burgundy" />
        Luyện tập
        {question.difficulty && (
          <span className="font-normal normal-case text-navy/60">
            · {DIFFICULTY_VI[question.difficulty] ?? question.difficulty}
          </span>
        )}
      </div>

      <div className="text-[15px] leading-relaxed text-navy">
        <MathText>{question.content}</MathText>
      </div>

      {!showSolution ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSolution(true)}
            className="cursor-pointer rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-125"
          >
            Xem lời giải
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {question.solution ? (
            <div className="rounded-xl bg-cream-light px-3 py-2.5 text-[14px] leading-relaxed text-navy">
              <Markdown>{question.solution}</Markdown>
            </div>
          ) : (
            <p className="text-sm text-navy/60">Bài này chưa có lời giải mẫu.</p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-navy/8 pt-3">
            {/* Tab mới: đang luyện dở mà điều hướng đi là mất cả phiên chat. */}
            <a
              href={`/resources/toan-hoc/q/${question.questionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-burgundy underline-offset-2 hover:underline"
            >
              Mở bài đầy đủ
              <ExternalLink className="size-3.5" />
            </a>

            <button
              type="button"
              onClick={next}
              className="ml-auto cursor-pointer rounded-xl border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-cream-light"
            >
              Bài khác
            </button>
          </div>

          {/* Bỏ bước học sinh tự chấm — giữ code phòng khi cần bật lại.
          {!isAssessed ? (
            <div className="border-t border-navy/8 pt-3">
              <p className="mb-2 text-sm font-medium text-navy">Đối chiếu xong, em thấy mình làm thế nào?</p>
              <div className="flex flex-wrap gap-2">
                {SELF_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    disabled={isLoading}
                    onClick={() => assess(o.key)}
                    className={`cursor-pointer rounded-xl border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${o.className}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-navy/8 pt-3">
              <button
                type="button"
                onClick={next}
                className="cursor-pointer rounded-xl border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-cream-light"
              >
                Bài khác
              </button>
            </div>
          )}
          */}
        </div>
      )}
    </div>
  );
};
