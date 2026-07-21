import { PanelLeft } from 'lucide-react';
import { AccountMenu } from './AccountMenu';
import type { QuotaView } from '../../services/quota.service';

interface Props {
  quota: QuotaView;
  onToggleSidebar: () => void;
}

export const Header = ({ quota, onToggleSidebar }: Props) => (
  <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-navy/10 bg-white px-4">
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2">
        <img src="/tutora-mark.png" alt="" className="size-8 rounded-lg object-cover" />
        <span className="font-serif text-lg font-bold text-navy">Tutora</span>
      </span>

      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Thu gọn / mở thanh bên"
        className="grid size-9 cursor-pointer place-items-center rounded-xl text-navy/70 transition hover:bg-cream-light hover:text-navy"
      >
        <PanelLeft className="size-5" />
      </button>
    </div>

    <AccountMenu quota={quota} />
  </header>
);
