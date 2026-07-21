import { Menu } from 'lucide-react';
import { AccountMenu } from './AccountMenu';
import type { QuotaView } from '../../services/quota.service';

interface Props {
  quota: QuotaView;
  onToggleSidebar: () => void;
}

/**
 * Header cố định trên cùng: nút thu/mở sidebar bên trái, tài khoản bên phải.
 * Trải hết chiều ngang (kể cả phía trên sidebar) giống Gauth, nên sidebar phải
 * chừa khoảng trống trên đúng bằng chiều cao header.
 */
export const Header = ({ quota, onToggleSidebar }: Props) => (
  <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-navy/10 bg-white px-4">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Thu gọn / mở thanh bên"
        className="grid size-9 cursor-pointer place-items-center rounded-xl text-navy/70 transition hover:bg-cream-light hover:text-navy"
      >
        <Menu className="size-5" />
      </button>

      <span className="flex items-center gap-2">
        <img src="/tutora-mark.png" alt="" className="size-8 rounded-lg object-cover" />
        <span className="font-serif text-lg font-bold text-navy">Tutora</span>
      </span>
    </div>

    <AccountMenu quota={quota} />
  </header>
);
