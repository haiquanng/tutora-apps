import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Hộp thoại xác nhận dùng chung. Mở/đóng bằng prop `open`.
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  danger,
  onConfirm,
  onCancel,
}: Props) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-5"
      >
        <div className="flex items-start gap-3">
          {danger && (
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-burgundy/10">
              <TriangleAlert className="size-5 text-burgundy" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-lg font-bold text-navy">{title}</h2>
            {message && <p className="mt-1 text-sm leading-relaxed text-navy/60">{message}</p>}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-navy/60 transition hover:bg-cream-light"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              danger ? 'bg-burgundy hover:bg-burgundy/90' : 'bg-navy hover:bg-navy/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
