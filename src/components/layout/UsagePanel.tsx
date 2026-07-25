interface Props {
  /** Số dư AI credit thật (null khi chưa đăng nhập / lỗi). */
  aiBalance: number | null;
}

export const UsagePanel = ({ aiBalance }: Props) => (
  <div className="rounded-xl bg-cream-light px-3 py-3">
    <span className="block text-xs font-medium text-navy/60">Lượt hỏi còn lại</span>
    <span className="mt-0.5 block text-2xl font-bold text-navy">
      {aiBalance !== null ? aiBalance.toLocaleString('vi-VN') : '—'}
    </span>
  </div>
);
