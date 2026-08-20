import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { AnalysisPanel } from '../components/assessment/AnalysisPanel';
import { AnswerReview } from '../components/assessment/AnswerReview';
import { RoadmapMindmap } from '../components/assessment/RoadmapMindmap';
import { ChapterPanel } from '../components/assessment/ChapterPanel';
import { RoadmapSteps } from '../components/assessment/RoadmapSteps';
import {
  isScoredFormat,
  fetchAttemptResult,
  parseAnalysisResult,
  runAnalysis,
  type Analysis,
  type AttemptResult,
  type ChapterMastery,
} from '../services/assessment.service';

/** Bài đã nộp mới có điểm/đáp án để xem lại. */
const isSubmitted = (r: AttemptResult) => r.status === 'submitted' || Boolean(r.submittedAt);

const formatDuration = (seconds: number | null) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} phút ${s}s` : `${s}s`;
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-navy/10 bg-white px-4 py-3">
    <p className="text-xs font-medium text-navy">{label}</p>
    <p className="mt-0.5 font-serif text-xl text-navy">{value}</p>
  </div>
);

/**
 * Kết quả 1 lượt làm bài — route RIÊNG /assessment/:attemptId/result.
 *
 * Tách khỏi AssessmentPage để reload không quay về pha khảo sát: trang tự tải lại
 * kết quả từ attemptId trên URL, và chỉ chạy phân tích khi bài chưa được phân tích.
 */
export const AssessmentResultPage = () => {
  const { attemptId = '' } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  // Mở từ lịch sử thì quay về lịch sử, còn lại giữ mặc định là lộ trình.
  const cameFromHistory = (state as { from?: string } | null)?.from === 'history';
  const backTo = cameFromHistory ? '/assessment/history' : '/roadmap';
  const backLabel = cameFromHistory ? 'Lịch sử làm bài' : 'Lộ trình học tập';

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isAnalyzing, setAnalyzing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [picked, setPicked] = useState<ChapterMastery | null>(null);

  const analyze = useCallback(async () => {
    if (!attemptId) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const data = await runAnalysis(attemptId);
      setAnalysis(data);
      const fresh = await fetchAttemptResult(attemptId).catch(() => null);
      if (fresh) setResult(fresh);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : 'Không phân tích được bài làm. Bạn thử lại nhé.');
    } finally {
      setAnalyzing(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    setLoading(true);
    setLoadError(null);
    fetchAttemptResult(attemptId)
      .then((data) => {
        if (cancelled) return;
        setResult(data);

        // Đã phân tích rồi -> đọc lại kết quả cũ, KHÔNG gọi AI lần nữa (tốn quota,
        // và reload trang không được phép ghi đè profile).
        const existing = parseAnalysisResult(data.analysisResult);
        if (existing) {
          setAnalysis(existing);
          return;
        }
        // Bài chưa nộp (tự thoát giữa chừng) thì CHƯA có câu trả lời nào để chấm —
        // gọi phân tích chỉ tổ 404. Trang sẽ hiện lối quay lại làm tiếp.
        if (!isSubmitted(data)) return;
        if (data.analysisStatus !== 'processing') void analyze();
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Không tải được kết quả.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // analyze phụ thuộc attemptId nên không đưa vào deps -> tránh chạy lại 2 lần.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const onPickChapter = useCallback(
    (chapter: { name: string; slug: string | null }) => {
      if (!chapter.slug) {
        navigate('/resources');
        return;
      }
      navigate(`/roadmap/chapter/${encodeURIComponent(chapter.slug)}?name=${encodeURIComponent(chapter.name)}`);
    },
    [navigate],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="size-6 animate-spin text-navy/40" />
      </div>
    );
  }

  if (loadError || !result) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-serif text-2xl text-navy">Không tìm thấy kết quả</p>
        <p className="mt-3 text-[15px] text-navy">
          {loadError ?? 'Bài làm này không tồn tại hoặc không thuộc về bạn.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="mt-6 cursor-pointer rounded-xl border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-cream-light"
        >
          Làm bài đánh giá mới
        </button>
      </div>
    );
  }

  const duration = formatDuration(result.durationSeconds);

  // Chỉ trắc nghiệm vào điểm.
  const scoredAnswers = result.answers.filter((a) => isScoredFormat(a.questionFormat));
  const reviewedAnswers = result.answers.filter((a) => !isScoredFormat(a.questionFormat));
  const reviewedCount = reviewedAnswers.length;

  // Bài bỏ dở: chưa nộp nên chưa có câu trả lời nào được chấm. Hiện 0/0 + lỗi phân tích
  // là sai sự thật -> nói thẳng trạng thái và mời làm lại.
  if (!isSubmitted(result)) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="flex cursor-pointer items-center gap-1.5 text-sm text-navy transition hover:opacity-70"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </button>

          <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy">Bài chưa hoàn thành</p>
            <h1 className="mt-2 font-serif text-2xl text-navy">{result.title}</h1>
            <p className="mt-1.5 text-[15px] text-navy">
              {[result.subjectName, result.gradeName].filter(Boolean).join(' · ')}
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-navy">
              Bạn đã thoát ra khi đang làm bài này nên chưa có kết quả. Làm lại từ đầu để nhận điểm và phân tích nhé.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/assessment')}
                className="cursor-pointer rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90"
              >
                Làm lại bài đánh giá
              </button>
              <button
                type="button"
                onClick={() => navigate('/assessment/history')}
                className="cursor-pointer rounded-xl border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-cream-light"
              >
                Lịch sử làm bài
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-(--breakpoint-2xl) px-6 py-10 2xl:px-10">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="flex cursor-pointer items-center gap-1.5 text-sm text-navy transition hover:opacity-70"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </button>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-navy">Kết quả đánh giá</p>
        <h1 className="mt-1.5 font-serif text-3xl text-navy">{result.title}</h1>
        <p className="mt-1.5 text-[15px] text-navy">
          {[result.subjectName, result.gradeName].filter(Boolean).join(' · ')}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-2xl">
          {/* Một thang đo duy nhất — ô "Điểm" cũ lệch với số câu đúng. */}
          <Stat label="Số câu đúng (trắc nghiệm)" value={`${result.correctCount}/${result.totalQuestions}`} />
          {reviewedCount > 0 && <Stat label="Câu tự luận" value={`${reviewedCount}`} />}
          {duration && <Stat label="Thời gian làm" value={duration} />}
        </div>

        {/* Mindmap bên trái, AI nhận xét bên phải. Lộ trình + bài làm nằm dưới cả 2. */}
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {analysis && analysis.chapter_mastery.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl text-navy">Bản đồ kiến thức</h2>
              <RoadmapMindmap
                subjectName={result.subjectName ?? 'Môn học'}
                gradeName={result.gradeName}
                analysis={analysis}
                selected={picked}
                onSelect={setPicked}
              />
            </section>
          )}

          <section className="xl:sticky xl:top-6">
            <h2 className="mb-4 font-serif text-xl text-navy">AI nhận xét</h2>

            {isAnalyzing && (
              <div className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-5 py-6 text-[15px] text-navy">
                <Loader2 className="size-4 animate-spin" />
                AI đang đọc bài làm và xây lộ trình cho bạn…
              </div>
            )}

            {!isAnalyzing && analysisError && (
              <div className="rounded-2xl border border-burgundy/20 bg-burgundy/5 px-5 py-5">
                <p className="text-[15px] text-burgundy">{analysisError}</p>
                <p className="mt-1 text-[14px] text-navy">Bài làm và điểm của bạn vẫn được giữ nguyên.</p>
                <button
                  type="button"
                  onClick={() => void analyze()}
                  className="mt-3 cursor-pointer rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
                >
                  Thử phân tích lại
                </button>
              </div>
            )}

            {!isAnalyzing && !analysisError && analysis && <AnalysisPanel analysis={analysis} />}
          </section>
        </div>

        {/* Panel chương: overlay phủ mép phải, nằm ngoài mọi grid. */}
        <ChapterPanel chapter={picked} onClose={() => setPicked(null)} onPickChapter={onPickChapter} />

        {analysis && analysis.recommended_path.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-serif text-xl text-navy">Lộ trình gợi ý</h2>
            <RoadmapSteps steps={analysis.recommended_path} onPickChapter={onPickChapter} />
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 font-serif text-xl text-navy">Xem lại bài làm</h2>
          <AnswerReview answers={scoredAnswers} />
        </section>

        {reviewedCount > 0 && (
          <section className="mt-10">
            <h2 className="font-serif text-xl text-navy">Câu tự luận</h2>
            <p className="mb-4 mt-1 text-[15px] text-navy">
              Những câu này không tính vào điểm — bạn xem đáp án mẫu và phần AI nhận xét ở trên nhé.
            </p>
            <AnswerReview answers={reviewedAnswers} />
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/roadmap')}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:brightness-105"
          >
            <Sparkles className="size-4" />
            Xem lộ trình học tập
          </button>
          <button
            type="button"
            onClick={() => navigate('/assessment/history')}
            className="cursor-pointer rounded-xl border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-cream-light"
          >
            Lịch sử làm bài
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="cursor-pointer rounded-xl border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-cream-light"
          >
            Về giải bài tập
          </button>
        </div>
      </div>
    </div>
  );
};
