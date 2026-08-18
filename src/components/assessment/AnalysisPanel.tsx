import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import type { Analysis } from '../../services/assessment.service';

export const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Đang xây nền',
  developing: 'Đang tiến bộ',
  proficient: 'Nắm vững',
  advanced: 'Nâng cao',
};

const LEVEL_STYLE: Record<string, string> = {
  beginner: 'border-burgundy/25 bg-burgundy/8 text-burgundy',
  developing: 'border-gold/50 bg-gold/15 text-navy',
  proficient: 'border-forest/30 bg-forest/10 text-forest',
  advanced: 'border-navy/20 bg-navy text-cream',
};

const CONFIDENCE_NOTE: Record<string, string> = {
  low: 'Đề còn ít câu nên nhận xét này chỉ mang tính tham khảo — làm thêm bài đánh giá sẽ chính xác hơn.',
  medium: 'Nhận xét dựa trên số câu vừa đủ, có thể còn sai lệch ở một vài chương.',
};

/**
 * Nhận xét tổng của AI: mức trình độ, tóm tắt, việc nên làm ngay.
 *
 * CỐ Ý không liệt kê điểm mạnh/lỗ hổng theo chương ở đây — thông tin đó đã nằm trên
 * node mindmap và trong modal từng chương, in lại lần nữa là 3 chỗ cùng một nội dung.
 */
export const AnalysisPanel = ({ analysis }: { analysis: Analysis }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
        {analysis.level && (
          <span
            className={`inline-block rounded-lg border px-3 py-1 text-[13px] font-semibold ${
              LEVEL_STYLE[analysis.level] ?? 'border-navy/15 text-navy'
            }`}
          >
            {LEVEL_LABEL[analysis.level] ?? analysis.level}
          </span>
        )}

        {analysis.summary && (
          <>
            <p
              className={`mt-4 whitespace-pre-line text-[15px] leading-relaxed text-navy/80 ${
                expanded ? '' : 'line-clamp-4'
              }`}
            >
              {analysis.summary}
            </p>
            {analysis.summary.length > 260 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 cursor-pointer text-[13px] font-semibold text-navy/60 transition hover:text-navy"
              >
                {expanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </>
        )}

        {analysis.confidence && CONFIDENCE_NOTE[analysis.confidence] && (
          <p className="mt-3 text-[13px] italic leading-relaxed text-navy/45">{CONFIDENCE_NOTE[analysis.confidence]}</p>
        )}

        {analysis.next_action && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-navy/70" />
            <p className="text-[15px] leading-relaxed text-navy">{analysis.next_action}</p>
          </div>
        )}
      </div>
    </div>
  );
};
