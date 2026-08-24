import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ClipboardCheck, Sparkles } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { fetchAttemptHistory, type AttemptResult } from '../services/assessment.service';

const PAGE_SIZE = 10;

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  return m > 0 ? `${m} phút` : `${seconds}s`;
};

/** Xanh/hổ phách/đỏ theo mức điểm — chỉ dùng khi đề cho xem điểm. */
const scoreTone = (percent: number) => {
  if (percent >= 80) return 'text-emerald-700';
  if (percent >= 50) return 'text-amber-700';
  return 'text-burgundy';
};

const Row = ({ attempt }: { attempt: AttemptResult }) => {
  const percent = attempt.scorePercent;
  const duration = formatDuration(attempt.durationSeconds);
  const isDone = attempt.status === 'submitted' || Boolean(attempt.submittedAt);

  return (
    <li>
      <Link
        to={`/assessment/${attempt.attemptId}/result`}
        state={{ from: 'history' }}
        className="group flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4 transition hover:border-gold"
      >
        {/* Điểm — chỉ hiện khi đề cho xem, còn lại giữ ô trung tính để hàng không lệch. */}
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-cream-light">
          {attempt.showResult && percent !== null && percent !== undefined ? (
            <span className={`font-serif text-lg font-semibold ${scoreTone(percent)}`}>{Math.round(percent)}%</span>
          ) : (
            <ClipboardCheck className="size-5 text-navy" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-navy">{attempt.title}</span>
          <span className="mt-0.5 block text-xs text-navy">
            {[attempt.subjectName, attempt.gradeName].filter(Boolean).join(' · ') || 'Bài đánh giá'}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy">
            {attempt.showResult && (
              <span className="text-navy">
                {attempt.correctCount}/{attempt.totalQuestions} câu đúng
              </span>
            )}
            <span>{formatDate(attempt.submittedAt ?? attempt.startedAt)}</span>
            {duration && <span>· {duration}</span>}
            {attempt.analysisStatus === 'done' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cream-light px-2 py-0.5 text-navy">
                <Sparkles className="size-3" /> Đã phân tích
              </span>
            )}
            {!isDone && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Chưa nộp</span>}
          </span>
        </span>

        <ChevronRight className="size-4 shrink-0 text-navy/25 transition group-hover:text-gold" />
      </Link>
    </li>
  );
};

const RowSkeleton = () => (
  <li className="flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4">
    <Skeleton className="size-14 shrink-0 rounded-xl" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  </li>
);

/**
 * Lịch sử các lượt làm bài đánh giá. Khác /history (lịch sử hỏi bài, lưu localStorage) —
 * dữ liệu ở đây từ BE: GET /assessments/attempts.
 */
export const AssessmentHistoryPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AttemptResult[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((pageNumber: number) => {
    setLoading(true);
    setError(null);
    fetchAttemptHistory({ pageNumber, pageSize: PAGE_SIZE })
      .then((res) => {
        setItems(res.items ?? []);
        setTotalPages(res.totalPages ?? 0);
        setTotalCount(res.totalCount ?? 0);
      })
      .catch((e: unknown) => {
        setItems([]);
        setError(e instanceof Error ? e.message : 'Không tải được lịch sử làm bài.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(page), [load, page]);

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-2xl) flex-1 overflow-y-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-navy">Lịch sử làm bài</h1>
        <p className="mt-1 text-sm text-navy">
          {totalCount > 0
            ? `${totalCount} lượt đánh giá — mở lại để xem đáp án và phân tích.`
            : 'Các bài đánh giá bạn đã làm sẽ xuất hiện ở đây.'}
        </p>
      </div>

      {isLoading ? (
        <ul className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </ul>
      ) : error ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center">
          <p className="text-navy">{error}</p>
          <button
            type="button"
            onClick={() => load(page)}
            className="mt-4 cursor-pointer rounded-xl border border-navy/15 px-4 py-2 text-sm font-medium text-navy transition hover:border-gold"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-navy/10 bg-white px-4 py-16 text-center">
          <ClipboardCheck className="size-10 text-navy/20" />
          <h2 className="mt-4 font-serif text-xl font-semibold text-navy">Chưa làm bài nào</h2>
          <p className="mt-1 text-navy">Làm một bài đánh giá để biết mình đang ở đâu.</p>
          <button
            type="button"
            onClick={() => navigate('/assessment')}
            className="mt-5 cursor-pointer rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90"
          >
            Bắt đầu đánh giá
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((a) => (
              <Row key={a.attemptId} attempt={a} />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer rounded-lg border border-navy/15 p-2 text-navy transition hover:border-gold disabled:cursor-default disabled:opacity-35 disabled:hover:border-navy/15"
                aria-label="Trang trước"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 text-sm text-navy">
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-lg border border-navy/15 p-2 text-navy transition hover:border-gold disabled:cursor-default disabled:opacity-35 disabled:hover:border-navy/15"
                aria-label="Trang sau"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
