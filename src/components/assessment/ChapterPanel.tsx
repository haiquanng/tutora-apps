import { useEffect, useState } from 'react';
import { ArrowRight, Dumbbell, Loader2, X } from 'lucide-react';
import { MathText } from '../ui/MathText';
import { useSubjects } from '../../hooks/useSubjects';
import { fetchQuestions, type PublicQuestion } from '../../services/questions.service';
import { verdictOf, type ChapterMastery, type Verdict } from '../../services/assessment.service';

const VERDICT: Record<Verdict, { text: string; chip: string }> = {
  gap: { text: 'Đang hổng', chip: 'border-burgundy/30 bg-burgundy/8 text-burgundy' },
  shaky: { text: 'Chưa chắc', chip: 'border-gold/60 bg-gold/15 text-navy' },
  solid: { text: 'Đã vững', chip: 'border-forest/30 bg-forest/10 text-forest' },
};

const PREVIEW = 4;

/**
 * Panel chi tiết chương, trượt từ PHẢI (kiểu roadmap.sh) thay vì modal giữa màn:
 * mindmap vẫn thấy nên biết đang học chương nào và còn chương nào.
 *
 * Không hiện % thông thạo — chỉ verdict và số câu đúng thật.
 */
export const ChapterPanel = ({
  chapter,
  onClose,
  onPickChapter,
}: {
  chapter: ChapterMastery | null;
  onClose: () => void;
  onPickChapter: (chapter: { name: string; slug: string | null }) => void;
}) => {
  const { subjects } = useSubjects();
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setLoading] = useState(false);

  const slug = chapter?.chapterSlug ?? null;

  useEffect(() => {
    if (!slug) {
      setQuestions([]);
      setTotalCount(0);
      return;
    }

    // Slug chương là duy nhất -> tự suy môn từ danh mục.
    const subject = subjects.find((s) => s.chapters.some((c) => c.slug === slug));
    if (!subject?.slug) return;

    let cancelled = false;
    setLoading(true);
    fetchQuestions({ subjectSlug: subject.slug, chapterSlug: slug, page: 1, pageSize: PREVIEW })
      .then((res) => {
        if (cancelled) return;
        setQuestions(res.items);
        setTotalCount(res.totalCount);
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, subjects]);

  // Esc để đóng — panel không chặn tương tác nên không dùng Dialog của Radix.
  useEffect(() => {
    if (!chapter) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chapter, onClose]);

  if (!chapter) return null;

  const verdict = VERDICT[verdictOf(chapter)];
  const improve = chapter.improve ?? [];
  const note = chapter.summary ?? chapter.note;
  const openChapter = () => {
    onClose();
    onPickChapter({ name: chapter.chapter, slug });
  };

  return (
    <>
      {/* Nền mờ: bấm ra ngoài để đóng. Không chặn cuộn trang phía sau. */}
      <div onClick={onClose} className="fixed inset-0 z-[60] animate-fade-in bg-navy/25" aria-hidden />

      <aside
        role="dialog"
        aria-label={chapter.chapter}
        className="fixed inset-y-0 right-0 z-[70] flex w-full animate-slide-in-right flex-col border-l border-navy/10 bg-white sm:w-[85vw] lg:w-[46vw] lg:max-w-[720px] lg:min-w-[560px]"
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-navy/8 px-7 py-6">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-2xl leading-snug text-navy">{chapter.chapter}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-lg border px-2.5 py-0.5 text-[12px] font-semibold ${verdict.chip}`}>
                {verdict.text}
              </span>
              <span className="text-[13px] text-navy">
                Đúng {chapter.correct}/{chapter.total} câu
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-navy transition hover:bg-cream-light"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          {note && <p className="text-[15px] leading-relaxed text-navy">{note}</p>}

          {improve.length > 0 && (
            <div className="mt-5">
              <h4 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-navy">
                <Dumbbell className="size-3.5" />
                Dạng bài nên luyện
              </h4>
              <ul className="mt-2.5 space-y-2">
                {improve.map((item) => (
                  <li key={item.title} className="rounded-xl border border-navy/10 bg-cream-light/40 px-3.5 py-2.5">
                    <p className="text-[14px] font-semibold text-navy">{item.title}</p>
                    {item.why && <p className="mt-0.5 text-[13px] leading-relaxed text-navy">{item.why}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5">
            <h4 className="text-[12px] font-semibold uppercase tracking-wide text-navy">Bài tập trong kho</h4>

            {isLoading && (
              <p className="mt-2.5 flex items-center gap-2 text-[14px] text-navy">
                <Loader2 className="size-3.5 animate-spin" />
                Đang tìm bài tập…
              </p>
            )}

            {!isLoading && questions.length === 0 && (
              <p className="mt-2.5 text-[14px] leading-relaxed text-navy">
                {slug
                  ? 'Chương này chưa có bài tập trong kho. Bạn có thể hỏi AI ở trang Giải bài tập.'
                  : 'Chương này chưa gắn mã nên chưa tra được bài tập.'}
              </p>
            )}

            {!isLoading && questions.length > 0 && (
              <ul className="mt-2.5 space-y-2">
                {questions.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={openChapter}
                      className="w-full cursor-pointer rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-left transition hover:border-gold hover:bg-cream-light/50"
                    >
                      <span className="line-clamp-2 text-[14px] leading-relaxed text-navy">
                        <MathText>{q.content}</MathText>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {totalCount > 0 && (
          <footer className="shrink-0 border-t border-navy/8 px-7 py-5">
            <button
              type="button"
              onClick={openChapter}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-navy transition hover:brightness-105"
            >
              Xem tất cả {totalCount} bài tập
              <ArrowRight className="size-4" />
            </button>
          </footer>
        )}
      </aside>
    </>
  );
};
