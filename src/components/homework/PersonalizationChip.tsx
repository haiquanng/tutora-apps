import { Link } from 'react-router-dom';
import type { ProficiencyProfile } from '../../services/assessment.service';

const LEVEL_VI: Record<string, string> = {
  beginner: 'Đang xây lại nền',
  developing: 'Đang củng cố',
  proficient: 'Đã khá vững',
  advanced: 'Đang nâng cao',
};

/** Tên chương yếu đầu tiên — cột JSON [{"chapter": "..."}]. */
const firstWeakChapter = (raw: string | null): string | null => {
  if (!raw) return null;
  try {
    const list = JSON.parse(raw) as { chapter?: string }[];
    return list?.[0]?.chapter ?? null;
  } catch {
    return null;
  }
};

/**
 * Cho học sinh THẤY lời giải đang được cá nhân hoá theo cái gì.
 */
export const PersonalizationChip = ({ profile }: { profile: ProficiencyProfile | null }) => {
  if (!profile) {
    return (
      <Link
        to="/assessment"
        className="cursor-pointer rounded-full border border-navy/12 px-3 py-1 text-xs text-navy transition hover:border-gold hover:bg-cream-light"
      >
        Làm bài đánh giá để lời giải hợp trình độ của bạn
      </Link>
    );
  }

  const level = LEVEL_VI[profile.level ?? ''] ?? null;
  const weak = firstWeakChapter(profile.weaknesses);
  // Không có chương yếu nào -> không bịa ra trạng thái để hiện.
  if (!weak) return null;

  return (
    <Link
      to="/roadmap"
      title="Xem lộ trình học tập của bạn"
      className="cursor-pointer rounded-full border border-navy/12 bg-cream-light px-3 py-1 text-xs text-navy transition hover:border-gold"
    >
      {level ? `${LEVEL_VI[profile.level ?? ''] ?? level} ` : 'Đang củng cố '}
      {weak}
    </Link>
  );
};
