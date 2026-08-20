import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { QuestionListItem } from '../components/resources/QuestionListItem';
import { Pagination } from '../components/resources/Pagination';
import { useSubjects } from '../hooks/useSubjects';
import { fetchQuestions, type QuestionPage } from '../services/questions.service';

/**
 * Bài tập của 1 chương — mở từ node mindmap/bước lộ trình. Slug chương là duy nhất
 * trong bảng chapters nên tự suy ra môn từ danh mục, không cần truyền subjectSlug qua URL.
 */
export const RoadmapChapterPage = () => {
  const { chapterSlug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { subjects, isLoading: subjectsLoading } = useSubjects();

  const [page, setPage] = useState(1);
  const [data, setData] = useState<QuestionPage | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tên chương từ query để hiện ngay, không chờ danh mục tải xong.
  const chapterName = searchParams.get('name') ?? '';

  const owner = useMemo(() => {
    for (const subject of subjects) {
      const chapter = subject.chapters.find((c) => c.slug === chapterSlug);
      if (chapter) return { subject, chapter };
    }
    return null;
  }, [subjects, chapterSlug]);

  useEffect(() => {
    setPage(1);
  }, [chapterSlug]);

  useEffect(() => {
    if (subjectsLoading) return;

    if (!owner?.subject.slug) {
      setLoading(false);
      setError('Không tìm thấy chương này trong danh mục môn học.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchQuestions({ subjectSlug: owner.subject.slug, chapterSlug, page })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Không tải được bài tập.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [owner, chapterSlug, page, subjectsLoading]);

  const title = owner?.chapter.name ?? chapterName ?? 'Bài tập theo chương';

  return (
    <div className="mx-auto max-w-(--breakpoint-2xl) px-6 py-10">
      <Link to="/roadmap" className="inline-flex items-center gap-1.5 text-sm text-navy/55 transition hover:text-navy">
        <ArrowLeft className="size-4" />
        Lộ trình học tập
      </Link>

      <h1 className="mt-4 font-serif text-3xl text-navy">{title}</h1>
      <p className="mt-1.5 text-[15px] text-navy/55">
        {owner ? `${owner.subject.name} · Lớp ${owner.chapter.grade}` : 'Bài tập luyện tập'}
        {data ? ` · ${data.totalCount} bài` : ''}
      </p>

      {(isLoading || subjectsLoading) && (
        <div className="mt-10 flex items-center gap-2 text-[15px] text-navy/50">
          <Loader2 className="size-4 animate-spin" />
          Đang tải bài tập…
        </div>
      )}

      {!isLoading && !subjectsLoading && error && (
        <p className="mt-10 rounded-xl border border-navy/10 bg-white px-5 py-6 text-center text-[15px] text-navy/55">
          {error}
        </p>
      )}

      {!isLoading && !subjectsLoading && !error && data && (
        <>
          {data.items.length === 0 ? (
            <div className="mt-10 rounded-xl border border-navy/10 bg-white px-5 py-8 text-center">
              <p className="text-[15px] text-navy/60">Chương này chưa có bài tập trong kho.</p>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:brightness-105"
                >
                  <Sparkles className="size-4" />
                  Hỏi AI bài chương này
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="mt-8 divide-y divide-navy/8 overflow-hidden rounded-2xl border border-navy/10 bg-white [&_a]:px-5 [&_a:hover]:bg-cream-light/40">
                {data.items.map((q) => (
                  <QuestionListItem
                    key={q.id}
                    question={q}
                    to={`/resources/${owner?.subject.slug}/${chapterSlug}/q/${q.id}`}
                  />
                ))}
              </ul>

              {data.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onChange={setPage} />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
