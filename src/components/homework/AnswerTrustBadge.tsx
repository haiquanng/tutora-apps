import { ArrowUpRight, BadgeCheck, BookCheck, Calculator, HelpCircle } from 'lucide-react';
import type { AnswerTrust } from '../../types/solve';

/**
 * Nhãn tin cậy, đứng cạnh nút vote ở cuối lời giải.
 */
const TIERS = {
  bank: {
    icon: BadgeCheck,
    label: 'Đã kiểm chứng từ gia sư',
    hint: 'Bài này trùng với câu gia sư Tutora đã duyệt lời giải.',
    className: 'border-emerald-600/35 bg-emerald-50 text-emerald-700',
  },
  rag: {
    icon: BookCheck,
    label: 'Tham khảo bài đã duyệt',
    hint: 'Mình bám theo cách giải của bài tương tự đã được gia sư duyệt.',
    className: 'border-sky-600/30 bg-sky-50 text-sky-700',
  },
  computed: {
    icon: Calculator,
    label: 'Đã kiểm tra đáp số',
    hint: 'Mình tính lại đáp số để đối chiếu.',
    className: 'border-violet-600/30 bg-violet-50 text-violet-700',
  },
  unsure: {
    icon: HelpCircle,
    label: 'Chưa chắc chắn',
    hint: 'Kết quả tính lại chưa khớp — em đối chiếu kỹ giúp mình nhé.',
    // Hổ phách chứ KHÔNG đỏ: đây là "chưa chắc", không phải app lỗi.
    className: 'border-amber-600/40 bg-amber-50 text-amber-800',
  },
} as const;

/** Bậc cao nhất mà bằng chứng cho phép. null = không kết luận được, không hiện gì. */
const pickTier = (trust?: AnswerTrust): keyof typeof TIERS | null => {
  if (!trust) return null;
  if (trust.bankVerified) return 'bank';
  if (trust.verified === false) return 'unsure';
  if (trust.ragUsed) return 'rag';
  if (trust.verified === true) return 'computed';
  return null;
};

export const AnswerTrustBadge = ({ trust }: { trust?: AnswerTrust }) => {
  const tier = pickTier(trust);
  if (!tier) return null;

  const { icon: Icon, label, hint, className } = TIERS[tier];
  const sourceId = (tier === 'bank' || tier === 'rag') && trust?.questionId ? trust.questionId : null;

  const body = (
    <>
      <Icon className="size-3.5 shrink-0" />
      {label}
      {sourceId && <ArrowUpRight className="size-3.5 shrink-0 opacity-60" />}
    </>
  );

  // Chip nhỏ, cao ngang nút vote để đứng cùng hàng không lệch.
  const base = `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${className}`;

  if (!sourceId) {
    return (
      <span className={base} title={hint}>
        {body}
      </span>
    );
  }

  return (
    <a
      href={`/resources/toan-hoc/q/${sourceId}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${hint} Bấm để mở bài gốc.`}
      className={`${base} cursor-pointer transition hover:border-gold`}
    >
      {body}
    </a>
  );
};
