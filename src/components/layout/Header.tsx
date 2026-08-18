import { ClipboardCheck, PanelLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { AccountMenu } from './AccountMenu';

interface Props {
  aiBalance: number | null;
  onToggleSidebar: () => void;
}

export const Header = ({ aiBalance, onToggleSidebar }: Props) => (
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

    <div className="flex items-center gap-2">
      {/* Lối vào nhanh phòng thi — /assessment là layout riêng, không sidebar. */}
      <NavLink
        to="/assessment"
        className={({ isActive }) =>
          `flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            isActive
              ? 'border-gold bg-cream-light text-navy'
              : 'border-navy/12 text-navy hover:border-gold hover:bg-cream-light'
          }`
        }
      >
        <ClipboardCheck className="size-4 shrink-0" />
        {/* Mobile chỉ để icon cho đỡ chật header. */}
        <span className="hidden sm:inline">Đánh giá năng lực</span>
      </NavLink>

      <AccountMenu aiBalance={aiBalance} />
    </div>
  </header>
);
