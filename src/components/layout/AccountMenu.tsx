import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Clock, House, LogOut, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { WEB_URL } from '../../services/api.service';
import type { QuotaView } from '../../services/quota.service';

interface Props {
  quota: QuotaView;
}

const initialOf = (name?: string, email?: string) => (name || email || 'T').trim().charAt(0).toUpperCase();

/** Avatar + dropdown tài khoản ở góc phải header (tham khảo Gauth). */
export const AccountMenu = ({ quota }: Props) => {
  const { user, isLoading, login, logout } = useAuth();
  const [isOpen, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  // Chưa biết trạng thái -> giữ chỗ, tránh nháy "Đăng nhập" rồi đổi thành avatar.
  if (isLoading) {
    return <div className="size-9 animate-pulse rounded-full bg-navy/10" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={login}
        className="cursor-pointer rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-125"
      >
        Đăng nhập
      </button>
    );
  }

  const periodLabel = quota.period === 'week' ? 'Tuần này' : 'Tháng này';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label="Tài khoản"
        className="grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full bg-burgundy text-sm font-semibold text-cream transition hover:brightness-110"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initialOf(user.fullName, user.email)
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-navy/10 bg-white p-3 shadow-soft">
          <div className="flex items-center gap-3 px-1 pb-3">
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-burgundy text-sm font-semibold text-cream">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initialOf(user.fullName, user.email)
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-navy">{user.fullName || 'Học sinh'}</span>
              {user.email && <span className="block truncate text-xs text-navy/50">{user.email}</span>}
            </span>
          </div>

          <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-navy/40">Hạn mức</p>
          <div className="rounded-xl bg-cream-light p-3">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-navy/60">Lượt hỏi</span>
              <span className="font-semibold text-navy">
                {quota.remaining}
                <span className="text-navy/40"> / {quota.limit}</span>
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-xs text-navy/40">
              <span>{periodLabel}</span>
              <span>{quota.activeClasses > 0 ? `${quota.activeClasses} lớp đang học` : 'Chưa có lớp'}</span>
            </div>
          </div>

          {quota.activeClasses === 0 && (
            <button
              type="button"
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-navy transition hover:brightness-105"
            >
              <Zap className="size-4" />
              Đăng ký lớp để có thêm lượt
            </button>
          )}

          <div className="my-2 border-t border-navy/10" />

          <a
            href={WEB_URL}
            target="_blank"
            onClick={() => setOpen(false)}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-navy/70 transition hover:bg-cream-light hover:text-navy"
          >
            <House className="size-4" />
            <span className="flex-1 text-left">Đến trang chủ</span>
            <ChevronRight className="size-4 text-navy/30" />
          </a>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/history');
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-navy/70 transition hover:bg-cream-light hover:text-navy"
          >
            <Clock className="size-4" />
            <span className="flex-1 text-left">Lịch sử hỏi bài</span>
            <ChevronRight className="size-4 text-navy/30" />
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-burgundy transition hover:bg-burgundy/10"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};
