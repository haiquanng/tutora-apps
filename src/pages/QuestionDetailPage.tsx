import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, SendHorizontal, TriangleAlert } from 'lucide-react';
import { Markdown } from '../components/homework/Markdown';
import { VoteButtons } from '../components/resources/VoteButtons';
import { Skeleton } from '../components/ui/Skeleton';
import { useSubjects } from '../hooks/useSubjects';
import { useAuth } from '../hooks/useAuth';
import { fetchQuestionById, fetchQuestions, voteQuestion } from '../services/questions.service';
import type { PublicQuestion } from '../services/questions.service';

const DIFFICULTY_LABEL: Record<string, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
};

export const QuestionDetailPage = () => {
  const { subjectSlug, chapterSlug, questionId } = useParams<{
    subjectSlug: string;
    chapterSlug?: string;
    questionId: string;
  }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { subjects } = useSubjects();

  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [related, setRelated] = useState<PublicQuestion[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [chatText, setChatText] = useState('');

  const subject = useMemo(() => subjects.find((s) => s.slug === subjectSlug), [subjects, subjectSlug]);
  const chapter = useMemo(
    () => (chapterSlug ? subject?.chapters.find((c) => c.slug === chapterSlug) : undefined),
    [subject, chapterSlug],
  );
  const listBase = `/resources/${subjectSlug}${chapterSlug ? `/${chapterSlug}` : ''}`;

  // Slug chương dùng cho "Liên quan": từ URL, hoặc tra từ tên chương của câu hỏi
  const relatedChapterSlug = useMemo(
    () =>
      chapterSlug ??
      (question?.chapterName ? subject?.chapters.find((c) => c.name === question.chapterName)?.slug : undefined),
    [chapterSlug, question?.chapterName, subject],
  );
  // Link câu liên quan luôn kèm chương để trang đích có sidebar liên quan.
  const relatedBase = relatedChapterSlug ? `/resources/${subjectSlug}/${relatedChapterSlug}` : listBase;

  useEffect(() => {
    if (!questionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0 });
    fetchQuestionById(questionId)
      .then((q) => !cancelled && setQuestion(q))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Không tải được câu hỏi.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  // "Liên quan": cùng chương, trừ câu đang xem, tối đa 20.
  useEffect(() => {
    if (!subjectSlug || !relatedChapterSlug) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    fetchQuestions({ subjectSlug, chapterSlug: relatedChapterSlug, page: 1, pageSize: 21 })
      .then((res) => !cancelled && setRelated(res.items.filter((q) => q.id !== questionId).slice(0, 20)))
      .catch(() => !cancelled && setRelated([]));
    return () => {
      cancelled = true;
    };
  }, [subjectSlug, relatedChapterSlug, questionId]);

  const handleVote = useCallback(
    async (vote: 1 | -1 | 0) => {
      if (!question) return;
      setVoting(true);
      try {
        const r = await voteQuestion(question.id, vote);
        setQuestion((prev) =>
          prev
            ? {
                ...prev,
                likeCount: r.likeCount,
                dislikeCount: r.dislikeCount,
                helpfulPercent: r.helpfulPercent,
                myVote: r.myVote,
              }
            : prev,
        );
      } catch (e) {
        if ((e as { unauthorized?: boolean }).unauthorized) login();
      } finally {
        setVoting(false);
      }
    },
    [question, login],
  );

  // Hỏi tiếp -> mở trang giải AI với đề bài + câu hỏi của user (prefill).
  const askAI = useCallback(() => {
    if (!question) return;
    const prompt = chatText.trim()
      ? `${chatText.trim()}\n\nĐề bài:\n${question.content}`
      : `Giải chi tiết bài này:\n${question.content}`;
    navigate('/', { state: { prefill: prompt } });
  }, [question, chatText, navigate]);

  const difficulty = question?.difficulty ? (DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-navy/50">
        <Link to="/resources" className="hover:text-navy">
          Tài nguyên
        </Link>
        {subject && (
          <>
            <ChevronRight className="size-3.5" />
            <Link to={`/resources/${subject.slug}`} className="hover:text-navy">
              {subject.name}
            </Link>
          </>
        )}
        {chapter && (
          <>
            <ChevronRight className="size-3.5" />
            <Link to={listBase} className="hover:text-navy">
              {chapter.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="text-navy/70">Câu hỏi</span>
      </nav>

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </p>
      )}

      {isLoading && <Skeleton className="h-64 w-full rounded-2xl" />}

      {question && (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Cột chính */}
          <div className="min-w-0 flex-1 space-y-5">
            <article className="rounded-sm bg-white p-6 shadow-soft">
              {(difficulty || question.questionTypeName) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {difficulty && (
                    <span className="rounded-full bg-cream-light px-2.5 py-0.5 text-xs font-medium text-navy/70">
                      {difficulty}
                    </span>
                  )}
                  {question.questionTypeName && (
                    <span className="rounded-full bg-cream-light px-2.5 py-0.5 text-xs font-medium text-navy/70">
                      {question.questionTypeName}
                    </span>
                  )}
                </div>
              )}

              <h1 className="mb-3 font-serif text-xl font-bold text-navy">Câu hỏi</h1>
              <Markdown>{question.content}</Markdown>

              {question.imageUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.imageUrls.map((url) => (
                    <img key={url} src={url} alt="" className="max-h-56 rounded-lg border border-navy/10" />
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-navy/5 pt-4">
                <VoteButtons
                  likeCount={question.likeCount}
                  dislikeCount={question.dislikeCount}
                  helpfulPercent={question.helpfulPercent}
                  myVote={question.myVote}
                  disabled={voting}
                  onVote={handleVote}
                />
              </div>
            </article>

            {/* Lời giải */}
            {question.solution && (
              <article className="rounded-sm bg-white p-6 shadow-soft">
                <h2 className="mb-3 font-serif text-xl font-bold text-navy">Lời giải</h2>
                <Markdown>{question.solution}</Markdown>
                {question.solutionSource && (
                  <p className="mt-3 text-xs italic text-navy/50">Nguồn: {question.solutionSource}</p>
                )}
              </article>
            )}

            {/* Box chat hỏi tiếp */}
            <div className="rounded-sm bg-white p-4 shadow-soft">
              <p className="mb-2 text-sm font-medium text-navy/70">Chưa rõ chỗ nào? Hỏi AI về câu này.</p>
              <div className="flex items-end gap-2">
                <textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      askAI();
                    }
                  }}
                  rows={1}
                  placeholder="Hỏi tiếp về câu này..."
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-navy/15 bg-cream/40 px-3 py-2.5 text-sm text-navy outline-none transition focus:border-gold"
                />
                <button
                  type="button"
                  onClick={askAI}
                  aria-label="Hỏi AI"
                  className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-navy text-white transition hover:bg-navy/90"
                >
                  <SendHorizontal className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar liên quan (cùng chương, tối đa 20). Cuộn riêng khi dài. */}
          {related.length > 0 && (
            <aside className="lg:w-80 lg:shrink-0">
              <div className="rounded-md bg-white p-4 shadow-soft lg:sticky lg:top-16">
                <h2 className="mb-3 font-serif text-lg font-bold text-navy">Liên quan</h2>
                <ul className="thin-scrollbar divide-y divide-navy/5 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
                  {related.map((q) => (
                    <li key={q.id}>
                      <Link
                        to={`${relatedBase}/q/${q.id}`}
                        className="block rounded-md px-2 py-2.5 transition hover:bg-cream-light/50"
                      >
                        <div className="line-clamp-2 [&_*]:!my-0 [&>div]:!text-[13px]">
                          <Markdown>{q.content}</Markdown>
                        </div>
                        {q.likeCount + q.dislikeCount > 0 && (
                          <span className="mt-1 block text-xs font-medium text-forest">
                            {q.helpfulPercent}% hữu ích
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
};
