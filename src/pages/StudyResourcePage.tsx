import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { QuestionListItem } from '../components/resources/QuestionListItem';
import { Pagination } from '../components/resources/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import { useSubjects } from '../hooks/useSubjects';
import { fetchQuestions } from '../services/questions.service';
import type { PublicQuestion } from '../services/questions.service';

const PAGE_SIZE = 20;

export const StudyResourcePage = () => {
  const { subjectSlug, chapterSlug } = useParams<{ subjectSlug: string; chapterSlug?: string }>();
  const { subjects } = useSubjects();

  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subject = useMemo(() => subjects.find((s) => s.slug === subjectSlug), [subjects, subjectSlug]);
  const chapter = useMemo(
    () => (chapterSlug ? subject?.chapters.find((c) => c.slug === chapterSlug) : undefined),
    [subject, chapterSlug],
  );

  // Đổi môn/chương -> về trang 1.
  useEffect(() => {
    setPage(1);
  }, [subjectSlug, chapterSlug]);

  useEffect(() => {
    if (!subjectSlug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Lên đầu trang khi đổi trang (trang cuộn ở viewport).
    window.scrollTo({ top: 0 });
    fetchQuestions({ subjectSlug, chapterSlug, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setQuestions(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Không tải được câu hỏi.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [subjectSlug, chapterSlug, page]);

  const title = chapter?.name ?? subject?.name ?? 'Tài nguyên';
  const detailBase = `/resources/${subjectSlug}${chapterSlug ? `/${chapterSlug}` : ''}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-navy/50">
        <Link to="/resources" className="hover:text-navy">
          Tài nguyên
        </Link>
        {subject && (
          <>
            <ChevronRight className="size-3.5" />
            {chapter ? (
              <Link to={`/resources/${subject.slug}`} className="hover:text-navy">
                {subject.name}
              </Link>
            ) : (
              <span className="text-navy/70">{subject.name}</span>
            )}
          </>
        )}
        {chapter && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-navy/70">{chapter.name}</span>
          </>
        )}
      </nav>

      <h1 className="font-serif text-3xl font-bold text-navy">{title}</h1>
      {!isLoading && !error && <p className="mt-1 text-sm text-navy/50">{totalCount} câu hỏi</p>}

      {error && (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </p>
      )}

      {isLoading && !error && (
        <div className="mt-6 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && !error && questions.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-navy/15 px-4 py-10 text-center text-navy/50">
          Chưa có câu hỏi nào cho mục này.
        </p>
      )}

      {!isLoading && questions.length > 0 && (
        <>
          {/* Ngăn nhau bằng 1 vạch kẻ (divide) thay vì card border cho gọn. */}
          <div className="mt-4 divide-y divide-navy/10">
            {questions.map((q) => (
              <QuestionListItem key={q.id} question={q} to={`${detailBase}/q/${q.id}`} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
};
