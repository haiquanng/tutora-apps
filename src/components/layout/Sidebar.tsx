import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookMarked,
  Bookmark,
  ChevronRight,
  ClipboardCheck,
  History,
  House,
  Map,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { UsagePanel } from './UsagePanel';
import { ResourcesFlyout } from './ResourcesFlyout';
import { HistoryList } from './HistoryList';

import type { HistoryItem } from '../../types/solve';

const linkClass =
  (collapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `flex cursor-pointer items-center gap-3 rounded-xl py-2.5 text-[15px] font-medium text-navy transition ${
      collapsed ? 'justify-center px-0' : 'px-3'
    } ${isActive ? 'bg-cream-light' : 'hover:bg-cream-light/60'}`;

interface Props {
  aiBalance: number | null;
  isOpen: boolean;
  onClose: () => void;
  // Lịch sử chat (chat_sessions) — mở lại ở /c/:id. Ghi chú có TRANG RIÊNG /notes (list→detail).
  history: HistoryItem[];
  historyLoading: boolean;
  onDeleteHistory: (id: string) => void;
}

const DESKTOP_QUERY = '(min-width: 1024px)'; // = breakpoint lg của Tailwind

export const Sidebar = ({ aiBalance, isOpen, onClose, history, historyLoading, onDeleteHistory }: Props) => {
  const [isResourcesOpen, setResourcesOpen] = useState(false);
  const [anchor, setAnchor] = useState({ left: 0, top: 0 });
  const [isDesktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const resourcesRef = useRef<HTMLLIElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const { pathname } = useLocation();
  const isResourcesActive = pathname === '/resources' || pathname.startsWith('/resources/');

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-id', 'sidebar-scrollbar');
    el.textContent = [
      '.history-scroll-area::-webkit-scrollbar{width:4px;height:4px}',
      '.history-scroll-area::-webkit-scrollbar-thumb{background:rgba(26,34,56,.55);border-radius:9999px}',
      '.history-scroll-area::-webkit-scrollbar-thumb:hover{background:rgba(26,34,56,.75)}',
      '.history-scroll-area::-webkit-scrollbar-track{background:transparent}',
    ].join('');
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

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
        {/* Nav items cố định — không scroll */}
        <nav className="shrink-0 overflow-x-hidden px-3 pt-3">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/"
                end
                onClick={closeFlyout}
                className={linkClass(collapsed)}
                title={collapsed ? 'Giải bài tập' : undefined}
              >
                <House className="size-[18px] shrink-0" />
                {!collapsed && 'Giải bài tập'}
              </NavLink>
            </li>

            <li ref={resourcesRef} onMouseEnter={openResources} onMouseLeave={scheduleClose} className="relative">
              <button
                type="button"
                onClick={() => (isResourcesOpen ? setResourcesOpen(false) : openResources())}
                aria-expanded={isResourcesOpen}
                title={collapsed ? 'Tài nguyên' : undefined}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl py-2.5 text-[15px] font-medium text-navy transition ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${isResourcesOpen || isResourcesActive ? 'bg-cream-light' : 'hover:bg-cream-light/60'}`}
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
              {/* end: /assessment/history là mục riêng. */}
              <NavLink
                to="/assessment"
                end
                onClick={closeFlyout}
                className={linkClass(collapsed)}
                title={collapsed ? 'Bài đánh giá' : undefined}
              >
                <ClipboardCheck className="size-[18px] shrink-0" />
                {!collapsed && 'Bài đánh giá'}
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/assessment/history"
                end
                onClick={closeFlyout}
                className={linkClass(collapsed)}
                title={collapsed ? 'Lịch sử làm bài' : undefined}
              >
                <History className="size-[18px] shrink-0" />
                {!collapsed && 'Lịch sử làm bài'}
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/roadmap"
                onClick={closeFlyout}
                className={linkClass(collapsed)}
                title={collapsed ? 'Lộ trình học tập' : undefined}
              >
                <Map className="size-[18px] shrink-0" />
                {!collapsed && 'Lộ trình học tập'}
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/notes"
                onClick={closeFlyout}
                className={linkClass(collapsed)}
                title={collapsed ? 'Ghi chú của tôi' : undefined}
              >
                <Bookmark className="size-[18px] shrink-0" />
                {!collapsed && 'Ghi chú của tôi'}
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/app"
                onClick={closeFlyout}
                className={linkClass(collapsed)}
                title={collapsed ? 'Ứng dụng' : undefined}
              >
                <Smartphone className="size-4.5 shrink-0" />
                {!collapsed && 'Ứng dụng'}
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Lịch sử — scroll độc lập, không kéo nav links lên theo */}
        {!collapsed && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3">
            <div className="border-t border-navy/5 pt-3">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-navy/40">Lịch sử</p>
            </div>
            <div className="history-scroll-area flex-1 overflow-y-auto overflow-x-hidden pb-1">
              <HistoryList
                items={history}
                isLoading={historyLoading}
                onDelete={onDeleteHistory}
                onNavigate={() => !isDesktop && onClose()}
              />
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="shrink-0 space-y-2 p-3">
            <UsagePanel aiBalance={aiBalance} />
            <NavLink
              to="/upgrade"
              onClick={() => !isDesktop && onClose()}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-navy transition hover:brightness-105"
            >
              <Sparkles className="size-4" />
              Nâng cấp hạn mức
            </NavLink>
          </div>
        )}
      </aside>
    </>
  );
};
