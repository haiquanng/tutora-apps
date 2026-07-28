import { useEffect, useState } from 'react';
import { GraduationCap, X } from 'lucide-react';
import { useTutorSuggestion } from '../../hooks/useTutorSuggestion';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TutorSuggestionModal } from './TutorSuggestionModal';

interface Props {
  sessionId?: string;
  enabled?: boolean;
  autoOpenable?: boolean;
}

/**
 * Thanh gợi ý gia sư ở cuối luồng chat.
 *
 * KHÔNG phải bong bóng tin nhắn: không lưu vào chat_histories, không vào lịch sử. Chi tiết
 * nằm trong modal để phần chat vẫn sạch.
 */
export const TutorSuggestionBanner = ({ sessionId, enabled = true, autoOpenable = false }: Props) => {
  const { suggestion, visible, dismiss, autoOpen, clearAutoOpen } = useTutorSuggestion(
    sessionId,
    enabled,
    autoOpenable,
  );
  const [open, setOpen] = useState(false);
  const [confirmingDismiss, setConfirmingDismiss] = useState(false);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  if (!suggestion?.shouldShow) return null;

  return (
    <>
      {visible ? (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-navy/10 bg-cream-light/60 px-4 py-2.5">
          <GraduationCap className="size-4 shrink-0 text-burgundy" />

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-navy/75">{suggestion.bannerText}</span>
            <span className="shrink-0 text-xs font-medium text-burgundy">Xem gia sư</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmingDismiss(true)}
            aria-label="Ẩn gợi ý"
            title="Ẩn gợi ý này"
            className="shrink-0 cursor-pointer rounded-md p-1 text-navy/30 transition hover:bg-white hover:text-navy"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        // Đã ẩn -> vẫn để lại lối quay lại, không mất hẳn.
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-navy/35 transition hover:bg-cream-light hover:text-navy/70"
        >
          <GraduationCap className="size-3.5" />
          Xem lại gợi ý gia sư
        </button>
      )}

      <ConfirmDialog
        open={confirmingDismiss}
        title="Ẩn gợi ý gia sư?"
        message="Gợi ý sẽ không hiện lại trong 7 ngày. Bạn vẫn xem lại được qua liên kết nhỏ ở cuối cuộc trò chuyện, hoặc tắt hẳn trong menu tài khoản."
        confirmLabel="Ẩn đi"
        cancelLabel="Giữ lại"
        onConfirm={() => {
          setConfirmingDismiss(false);
          dismiss();
        }}
        onCancel={() => setConfirmingDismiss(false)}
      />

      <TutorSuggestionModal
        open={open}
        onClose={() => {
          setOpen(false);
          clearAutoOpen();
        }}
        suggestion={suggestion}
        sessionId={sessionId}
      />
    </>
  );
};
