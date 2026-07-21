import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { BookMarked, ChevronRight, Clock, House, Smartphone } from 'lucide-react';
import { UsagePanel } from './UsagePanel';
import { ResourcesFlyout } from './ResourcesFlyout';
import type { QuotaView } from '../../services/quota.service';

const NAV_ITEMS = [
  { to: '/', label: 'Giải bài tập', icon: House, end: true },
  { to: '/history', label: 'Lịch sử', icon: Clock, end: false },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-navy transition ${
    isActive ? 'bg-cream-light' : 'hover:bg-cream-light/60'
  }`;

interface Props {
  quota: QuotaView;
  /** Mobile: sidebar trượt ra như drawer. */
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar cố định toàn chiều cao viewport, cuộn độc lập với nội dung trang.
 * Trang chỉ cần chừa lề trái (lg:pl-72), KHÔNG bọc sidebar trong flex layout —
 * nếu để lg:static thì sidebar cao theo content, không còn full height.
 */
const DESKTOP_QUERY = '(min-width: 1024px)'; // = breakpoint lg của Tailwind

export const Sidebar = ({ quota, isOpen, onClose }: Props) => {
  const [isResourcesOpen, setResourcesOpen] = useState(false);
  const [anchor, setAnchor] = useState({ left: 0, top: 0 });
  const [isDesktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const resourcesRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  // Flyout dùng fixed nên phải tự biết đang ở desktop hay không (không thể dựa vào
  // class lg: như bình thường).
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const cancelClose = () => window.clearTimeout(closeTimer.current);

  // Trễ một nhịp: chuột đi chéo từ nút sang panel sẽ lướt qua khoảng trống,
  // đóng ngay lập tức sẽ làm panel biến mất giữa chừng.
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setResourcesOpen(false), 180);
  };

  const openResources = () => {
    cancelClose();
    const rect = resourcesRef.current?.getBoundingClientRect();
    if (rect) {
      // Kẹp top để panel không tràn đáy màn hình khi mục nằm thấp.
      const maxHeight = Math.min(window.innerHeight * 0.7, 512);
      const top = Math.min(rect.top, Math.max(8, window.innerHeight - maxHeight - 16));
      setAnchor({ left: rect.right, top });
    }
    setResourcesOpen(true);
  };

  // Nhấn Esc / cuộn / đổi kích thước -> đóng flyout (vị trí fixed sẽ lệch).
  useEffect(() => {
    if (!isResourcesOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setResourcesOpen(false);
    };
    const onScrollOrResize = () => setResourcesOpen(false);

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onScrollOrResize);
    // true = bắt cả cuộn bên trong <nav>, không chỉ cuộn window.
    document.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [isResourcesOpen]);

  /**
   * Bấm một mục điều hướng: CHỈ đóng flyout Tài nguyên, KHÔNG đóng sidebar.
   * Sidebar chỉ đóng khi bấm icon hamburger ở header, hoặc khi thu về mobile.
   */
  const closeFlyout = () => {
    cancelClose();
    setResourcesOpen(false);
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onClose}
          className="fixed inset-0 z-30 cursor-pointer bg-navy/40 lg:hidden"
        />
      )}

      {/* top-14 = chừa chỗ cho Header (h-14). Logo nằm ở header, không lặp ở đây. */}
      <aside
        className={`fixed bottom-0 left-0 top-14 z-40 flex w-72 flex-col border-r border-navy/10 bg-white transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* overflow-x-hidden: chặn cuộn ngang khi flyout xổ trong luồng ở mobile. */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} onClick={closeFlyout} className={linkClass}>
                  <Icon className="size-[18px]" />
                  {label}
                </NavLink>
              </li>
            ))}

            <li ref={resourcesRef} onMouseEnter={openResources} onMouseLeave={scheduleClose} className="relative">
              <button
                type="button"
                onClick={() => (isResourcesOpen ? setResourcesOpen(false) : openResources())}
                aria-expanded={isResourcesOpen}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-navy transition ${
                  isResourcesOpen ? 'bg-cream-light' : 'hover:bg-cream-light/60'
                }`}
              >
                <BookMarked className="size-[18px]" />
                <span className="flex-1 text-left">Tài nguyên</span>
                <ChevronRight className={`size-4 transition ${isResourcesOpen ? 'rotate-90' : ''}`} />
              </button>

              {isResourcesOpen &&
                (isDesktop ? (
                  // Phải PORTAL ra body: <aside> có translate-x-* nên nó tạo containing
                  // block mới, khiến cả position:fixed cũng bị neo lại bên trong sidebar
                  // (và <nav> overflow-y-auto thì kẹp tiếp). Render ngoài body mới thoát.
                  createPortal(
                    <div
                      style={{ left: anchor.left, top: anchor.top }}
                      className="fixed z-50 pl-2"
                      onMouseEnter={cancelClose}
                      onMouseLeave={scheduleClose}
                    >
                      <ResourcesFlyout onNavigate={closeFlyout} />
                    </div>,
                    document.body,
                  )
                ) : (
                  // Mobile: sidebar hẹp, không đủ chỗ bung ngang -> xổ xuống trong luồng.
                  <div className="mt-1">
                    <ResourcesFlyout onNavigate={closeFlyout} />
                  </div>
                ))}
            </li>

            <li>
              <NavLink to="/app" onClick={closeFlyout} className={linkClass}>
                <Smartphone className="size-[18px]" />
                Ứng dụng
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="p-3">
          <UsagePanel quota={quota} />
        </div>
      </aside>
    </>
  );
};
