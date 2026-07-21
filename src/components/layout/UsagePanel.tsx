import type { QuotaView } from '../../services/quota.service';

interface Props {
  quota: QuotaView;
}

export const UsagePanel = ({ quota }: Props) => {
  const percent = quota.limit ? Math.min(100, (quota.used / quota.limit) * 100) : 0;

  return (
    <div className="rounded-xl bg-cream-light px-3 py-2.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-navy/60">Lượt hỏi còn lại</span>
        <span className="font-semibold text-navy">
          {quota.remaining}
          <span className="text-navy/40"> / {quota.limit}</span>
        </span>
      </div>

      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-navy/10">
        <div
          className={`h-full rounded-full transition-all ${quota.isExhausted ? 'bg-burgundy' : 'bg-gold'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
