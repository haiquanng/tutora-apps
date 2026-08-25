import { Clock } from 'lucide-react';

interface Props {
  /** Số dư AI credit thật (null khi chưa đăng nhập / lỗi). */
  aiBalance: number | null;
  /** Ngày hết hạn của lô sắp hết hạn nhất. */
  nextExpiryAt?: string | null;
  expiringAmount?: number;
}

/** Còn <= số ngày này thì mới nhắc — nhắc quá sớm thành nhiễu. */
const WARN_WITHIN_DAYS = 14;

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

export const UsagePanel = ({ aiBalance, nextExpiryAt, expiringAmount = 0 }: Props) => {
  const days = nextExpiryAt ? daysLeft(nextExpiryAt) : null;
  // Chỉ nhắc khi thật sự sắp mất lượt: còn hạn ngắn VÀ còn lượt để mất.
  const warn = days !== null && days >= 0 && days <= WARN_WITHIN_DAYS && expiringAmount > 0;

  return (
    <div className="rounded-xl bg-cream-light px-3 py-3">
      <span className="block text-xs font-medium text-navy/60">Lượt hỏi còn lại</span>
      <span className="mt-0.5 block text-2xl font-bold text-navy">
        {aiBalance !== null ? aiBalance.toLocaleString('vi-VN') : '—'}
      </span>

      {warn && (
        <span className="mt-2 flex items-start gap-1.5 border-t border-navy/8 pt-2 text-[11px] leading-snug text-amber-800">
          <Clock className="mt-px size-3 shrink-0" />
          <span>
            {expiringAmount} lượt hết hạn {days === 0 ? 'hôm nay' : `sau ${days} ngày`}
          </span>
        </span>
      )}
    </div>
  );
};
