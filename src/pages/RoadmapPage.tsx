import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { AnalysisPanel, LEVEL_LABEL } from '../components/assessment/AnalysisPanel';
import { RoadmapMindmap } from '../components/assessment/RoadmapMindmap';
import { ChapterPanel } from '../components/assessment/ChapterPanel';
import { RoadmapSteps } from '../components/assessment/RoadmapSteps';
import {
  fetchAttemptResult,
  fetchProficiency,
  parseAnalysisResult,
  parseProfile,
  type Analysis,
  type ChapterMastery,
  type ProficiencyProfile,
} from '../services/assessment.service';

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(iso)) : null;

/**
 * Trang Lộ trình học tập. Chưa làm bài đánh giá -> empty state mời làm bài.
 */
export const RoadmapPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProficiencyProfile[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isLoadingDetail, setLoadingDetail] = useState(false);
  // Chương đang mở ở panel phải. Đổi môn -> đóng panel (chương không còn thuộc môn mới).
  const [picked, setPicked] = useState<ChapterMastery | null>(null);

  const active = useMemo(
    () => profiles.find((p) => p.subjectId === activeId) ?? profiles[0] ?? null,
    [profiles, activeId],
  );

  useEffect(() => {
    let cancelled = false;
    fetchProficiency()
      .then((list) => {
        if (cancelled) return;
        // Môn cập nhật gần nhất lên đầu.
        const sorted = [...list].sort(
          (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
        );
        setProfiles(sorted);
        setActiveId(sorted[0]?.subjectId ?? null);
      })
      .catch(() => {
        if (!cancelled) toast.error('Không tải được lộ trình học tập.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Đổi môn -> nạp lại analysis đầy đủ của môn đó.
  useEffect(() => {
    if (!active) {
      setAnalysis(null);
      return;
    }

    let cancelled = false;
    setPicked(null);
    const fromProfile = parseProfile(active);

    if (!active.sourceAttemptId) {
      setAnalysis(fromProfile);
      return;
    }

    setLoadingDetail(true);
    fetchAttemptResult(active.sourceAttemptId)
      .then((attempt) => {
        if (cancelled) return;
        const full = parseAnalysisResult(attempt.analysisResult);
        setAnalysis(full ?? fromProfile);
      })
      .catch(() => {
        // Không lấy được attempt -> vẫn hiện lộ trình từ profile, chỉ thiếu mindmap.
        if (!cancelled) setAnalysis(fromProfile);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  const onPickChapter = useCallback(
    (chapter: { name: string; slug: string | null }) => {
      if (!chapter.slug) {
        toast.info(`Chương "${chapter.name}" chưa gắn mã, mình mở tài nguyên chung nhé.`);
        navigate('/resources');
        return;
      }
      navigate(`/roadmap/chapter/${encodeURIComponent(chapter.slug)}?name=${encodeURIComponent(chapter.name)}`);
    },
    [navigate],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy/40" />
      </div>
    );
  }

  // Empty state: chưa có profile nào -> mời làm bài đánh giá.
  if (!profiles.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-14 text-center">
        {/* Sticker nền trong suốt -> để tự do, không bọc khung kẻo trông như ảnh lỗi. */}
        <img src="/images/no-roadmap.png" alt="" className="mx-auto size-64 select-none object-contain sm:size-100" />
        <h1 className="mt-0 font-serif text-2xl text-navy">Chưa có lộ trình học tập</h1>
        <p className="mt-0 text-[15px] leading-relaxed text-navy/60">
          Làm một bài đánh giá đầu vào để AI hiểu bạn đang ở đâu, rồi dựng bản đồ kiến thức và lộ trình học riêng cho
          bạn.
        </p>
        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="mt-7 cursor-pointer rounded-xl bg-gold px-6 py-3 text-[15px] font-semibold text-navy transition hover:brightness-105"
        >
          Làm bài đánh giá
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-(--breakpoint-2xl) px-6 py-10 2xl:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-navy">Lộ trình học tập</h1>
          {active && (
            <p className="mt-1.5 text-[15px] text-navy/55">
              {active.subjectName}
              {active.level && ` · ${LEVEL_LABEL[active.level] ?? active.level}`}
              {formatDate(active.updatedAt) && ` · cập nhật ${formatDate(active.updatedAt)}`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-cream-light"
        >
          <RefreshCw className="size-4" />
          Đánh giá lại
        </button>
      </div>

      {/* Nhiều môn -> tab chọn môn. 1 môn thì khỏi hiện. */}
      {profiles.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button
              key={p.subjectId}
              type="button"
              onClick={() => setActiveId(p.subjectId)}
              className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                p.subjectId === active?.subjectId
                  ? 'border-gold bg-cream-light text-navy'
                  : 'border-navy/10 bg-white text-navy/65 hover:bg-cream-light/60'
              }`}
            >
              {p.subjectName ?? `Môn #${p.subjectId}`}
            </button>
          ))}
        </div>
      )}

      {isLoadingDetail && (
        <div className="mt-8 flex items-center gap-2 text-[15px] text-navy/50">
          <Loader2 className="size-4 animate-spin" />
          Đang tải lộ trình…
        </div>
      )}

      {!isLoadingDetail && analysis && (
        <>
          {/* Mindmap bên trái (rộng hơn vì là nội dung chính), nhận xét bên phải. */}
          <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {analysis.chapter_mastery.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-xl text-navy">Bản đồ kiến thức</h2>
                <RoadmapMindmap
                  subjectName={active?.subjectName ?? 'Môn học'}
                  gradeName={active?.gradeName}
                  analysis={analysis}
                  selected={picked}
                  onSelect={setPicked}
                />
              </section>
            )}

            <section className="xl:sticky xl:top-6">
              <h2 className="mb-4 font-serif text-xl text-navy">AI nhận xét</h2>
              <AnalysisPanel analysis={analysis} />
            </section>
          </div>

          {/* Panel chương: overlay phủ mép phải, nằm ngoài mọi grid. */}
          <ChapterPanel chapter={picked} onClose={() => setPicked(null)} onPickChapter={onPickChapter} />

          {/* Lộ trình nằm dưới cả 2, chia nhiều cột cho khỏi thành 1 dải dài. */}
          {analysis.recommended_path.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-serif text-xl text-navy">Lộ trình gợi ý</h2>
              <RoadmapSteps steps={analysis.recommended_path} onPickChapter={onPickChapter} />
            </section>
          )}
        </>
      )}
    </div>
  );
};
