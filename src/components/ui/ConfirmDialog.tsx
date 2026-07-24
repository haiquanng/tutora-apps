import { TriangleAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog';

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
 * Hộp thoại xác nhận dùng chung (trên shadcn/Radix Dialog) — portal toàn cục web, ESC +
 * click nền để đóng đã có sẵn từ Radix. Giữ API cũ để mọi nơi gọi không phải sửa.
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
}: Props) => (
  <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
    <DialogContent showClose={false}>
      <div className="flex items-start gap-3">
        {danger && (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-burgundy/10">
            <TriangleAlert className="size-5 text-burgundy" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <DialogTitle>{title}</DialogTitle>
          {message && <DialogDescription>{message}</DialogDescription>}
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
    </DialogContent>
  </Dialog>
);
