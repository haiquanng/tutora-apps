import { ArrowRight, Target } from 'lucide-react';
import type { PathStep } from '../../services/assessment.service';

/** Lộ trình đề xuất: các bước theo THỨ TỰ HỌC, bấm để mở bài tập của chương. */
export const RoadmapSteps = ({
  steps,
  onPickChapter,
}: {
  steps: PathStep[];
  onPickChapter: (chapter: { name: string; slug: string | null }) => void;
}) => {
  if (!steps.length) return null;

  const ordered = [...steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <ol className="space-y-3">
      {ordered.map((step, i) => (
        <li key={`${step.order}-${step.chapter}`} className="relative pl-11">
          {/* Đường nối dọc giữa các bước — trừ bước cuối. */}
          {i < ordered.length - 1 && (
            <span className="absolute left-[15px] top-9 h-[calc(100%-1rem)] w-px bg-navy/12" />
          )}
          <span className="absolute left-0 top-1 flex size-8 items-center justify-center rounded-full border border-navy/12 bg-cream-light text-[13px] font-bold text-navy">
            {step.order ?? i + 1}
          </span>

          <div className="rounded-xl border border-navy/10 bg-white p-4">
            {/* Không hiện estimatedSessions: AI đoán "~2 buổi" từ một bài 10 câu, con số
                đó không có cơ sở khách quan nào. */}
            <h3 className="font-serif text-[17px] text-navy">{step.chapter}</h3>

            {step.goal && (
              <p className="mt-2 flex items-start gap-1.5 text-[15px] leading-relaxed text-navy">
                <Target className="mt-1 size-3.5 shrink-0 text-gold" />
                {step.goal}
              </p>
            )}
            {step.why && <p className="mt-1.5 text-[14px] leading-relaxed text-navy">{step.why}</p>}

            {step.practice?.length ? (
              <ul className="mt-3 space-y-1">
                {step.practice.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-[14px] text-navy">
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-navy/30" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              onClick={() => onPickChapter({ name: step.chapter, slug: step.chapterSlug })}
              className="mt-3.5 flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy/12 px-3 py-1.5 text-[13px] font-semibold text-navy transition hover:border-gold hover:bg-cream-light"
            >
              Luyện bài chương này
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
};
