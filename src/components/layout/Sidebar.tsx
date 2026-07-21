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

const linkClass =
  (collapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `flex cursor-pointer items-center gap-3 rounded-xl py-2.5 text-[15px] font-medium text-navy transition ${
      collapsed ? 'justify-center px-0' : 'px-3'
    } ${isActive ? 'bg-cream-light' : 'hover:bg-cream-light/60'}`;

interface Props {
  quota: QuotaView;
  isOpen: boolean;
  onClose: () => void;
}

const DESKTOP_QUERY = '(min-width: 1024px)'; // = breakpoint lg của Tailwind

export const Sidebar = ({ quota, isOpen, onClose }: Props) => {
  const [isResourcesOpen, setResourcesOpen] = useState(false);
  const [anchor, setAnchor] = useState({ left: 0, top: 0 });
  const [isDesktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const resourcesRef = useRef<HTMLLIElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const cancelClose = () => window.clearTimeout(closeTimer.current);

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setResourcesOpen(false), 180);
  };

  const openResources = () => {
    cancelClose();
    const rect = resourcesRef.current?.getBoundingClientRect();
    if (rect) {
      const maxHeight = Math.min(window.innerHeight * 0.7, 512);
      const top = Math.min(rect.top, Math.max(8, window.innerHeight - maxHeight - 16));
      setAnchor({ left: rect.right, top });
    }
    setResourcesOpen(true);
  };

  useEffect(() => {
    if (!isResourcesOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setResourcesOpen(false);
    };
    const onResize = () => setResourcesOpen(false);
    const onScroll = (e: Event) => {
      if (flyoutRef.current?.contains(e.target as Node)) return;
      setResourcesOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    // true = bắt cả cuộn bên trong <nav>, không chỉ cuộn window.
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [isResourcesOpen]);

  const closeFlyout = () => {
    cancelClose();
    setResourcesOpen(false);
  };

  const collapsed = isDesktop && !isOpen;

  return (
    <>
      {isOpen && !isDesktop && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onClose}
          className="fixed inset-0 z-30 cursor-pointer bg-navy/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-14 z-40 flex flex-col border-r border-navy/10 bg-white transition-all ${
          collapsed ? 'w-16' : 'w-72'
        } ${isOpen || isDesktop ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={closeFlyout}
                  className={linkClass(collapsed)}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {!collapsed && label}
                </NavLink>
              </li>
            ))}

            <li ref={resourcesRef} onMouseEnter={openResources} onMouseLeave={scheduleClose} className="relative">
              <button
                type="button"
                onClick={() => (isResourcesOpen ? setResourcesOpen(false) : openResources())}
                aria-expanded={isResourcesOpen}
                title={collapsed ? 'Tài nguyên' : undefined}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl py-2.5 text-[15px] font-medium text-navy transition ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${isResourcesOpen ? 'bg-cream-light' : 'hover:bg-cream-light/60'}`}
              >
                <BookMarked className="size-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Tài nguyên</span>
                    <ChevronRight className={`size-4 transition ${isResourcesOpen ? 'rotate-90' : ''}`} />
                  </>
                )}
              </button>

              {isResourcesOpen &&
                (isDesktop ? (
                  createPortal(
                    <div
                      ref={flyoutRef}
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
                  <div className="mt-1">
                    <ResourcesFlyout onNavigate={closeFlyout} />
                  </div>
                ))}
            </li>

            <li>
              <NavLink
                to="/app"
                onClick={closeFlyout}
                className={linkClass(collapsed)}
                title={collapsed ? 'Ứng dụng' : undefined}
              >
                <Smartphone className="size-[18px] shrink-0" />
                {!collapsed && 'Ứng dụng'}
              </NavLink>
            </li>
          </ul>
        </nav>

        {!collapsed && (
          <div className="p-3">
            <UsagePanel quota={quota} />
          </div>
        )}
      </aside>
    </>
  );
};
