import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  loginWithGoogle,
  loginWithPassword,
  openForgotPasswordPage,
  openRegisterPage,
} from '../../services/auth.service';
import type { AuthUser } from '../../services/auth.service';
import { WEB_URL } from '../../services/api.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** AuthProvider cập nhật user, không rời màn hình. */
  onSuccess: (user: AuthUser | null) => void;
}

const inputClass =
  'w-full rounded-xl border border-navy/12 bg-white px-3 py-2.5 text-sm text-navy outline-none transition placeholder:text-navy/30 focus:border-gold disabled:opacity-60';

export const LoginModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = (user: AuthUser | null) => {
    toast.success('Đăng nhập thành công');
    onSuccess(user);
    onClose();
    setIdentifier('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const who = identifier.trim();
    if (!who || !password) {
      setError('Bạn nhập email/số điện thoại và mật khẩu nhé.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await loginWithPassword(who, password);

      // Luồng OTP chỉ web chính có.
      if (result.requiresPhoneVerification) {
        setError('Số điện thoại chưa xác thực. Đang mở trang xác thực…');
        window.open(`${WEB_URL}/verify-phone?phone=${encodeURIComponent(result.phone ?? who)}`, '_blank', 'noopener');
        return;
      }

      finish(result.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Bạn thử lại nhé.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (idToken: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginWithGoogle(idToken);
      finish(result.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Đăng nhập Tutora</DialogTitle>
        <DialogDescription>Đăng nhập để gửi bài và lưu lại lịch sử hỏi bài của bạn.</DialogDescription>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy/70">Email hoặc số điện thoại</span>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="090... hoặc email@example.com"
              autoComplete="username"
              disabled={isSubmitting}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy/70">Mật khẩu</span>
            <span className="relative block">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-navy/40 transition hover:bg-cream-light hover:text-navy"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          {error && <p className="rounded-xl bg-burgundy/10 px-3 py-2 text-sm text-burgundy">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-cream transition enabled:cursor-pointer enabled:hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Đăng nhập
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-navy/35">
          <span className="h-px flex-1 bg-navy/10" />
          hoặc
          <span className="h-px flex-1 bg-navy/10" />
        </div>

        <GoogleSignInButton onCredential={handleGoogle} disabled={isSubmitting} />

        {/* Đăng ký cần vai trò + OTP, để web chính lo. */}
        <p className="mt-4 text-center text-sm text-navy/50">
          <button
            type="button"
            onClick={openForgotPasswordPage}
            className="cursor-pointer font-medium text-navy/70 underline-offset-2 hover:underline"
          >
            Quên mật khẩu?
          </button>
          <span className="px-2 text-navy/25">·</span>
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={openRegisterPage}
            className="cursor-pointer font-semibold text-navy underline-offset-2 hover:underline"
          >
            Đăng ký
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};
