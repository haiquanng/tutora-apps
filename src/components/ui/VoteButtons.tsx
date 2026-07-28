import { useEffect, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { FeedbackModal } from './FeedbackModal';
import type { FeedbackReason } from './FeedbackModal';
import type { VoteValue } from '../../services/feedback.service';

interface Props {
  reasons: FeedbackReason[];
  onVote: (vote: VoteValue, reason?: string, detail?: string) => Promise<unknown>;
  /** Đánh giá đã lưu ở server — có thì hiện trạng thái đã bấm ngay khi mở lại trang. */
  initialVote?: VoteValue | null;
  modalTitle?: string;
  modalDescription?: string;
  size?: 'sm' | 'md';
}

export const VoteButtons = ({ reasons, onVote, initialVote, modalTitle, modalDescription, size = 'md' }: Props) => {
  const [voted, setVoted] = useState<VoteValue | null>(initialVote ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, setPending] = useState(false);

  // Lịch sử chat nạp bất đồng bộ
  useEffect(() => {
    if (initialVote) setVoted(initialVote);
  }, [initialVote]);

  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';
  const btnClass = size === 'sm' ? 'p-1' : 'p-1.5';

  const send = async (vote: VoteValue, reason?: string, detail?: string) => {
    setPending(true);
    setVoted(vote); // optimistic: bấm là thấy phản hồi ngay
    try {
      await onVote(vote, reason, detail);
      if (vote === -1) toast.success('Cảm ơn góp ý của bạn!');
    } catch {
      setVoted(null); // lỗi -> trả về chưa đánh giá để bấm lại được
      toast.error('Không gửi được đánh giá. Vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  };

  // Đã đánh giá -> chỉ hiện đúng lựa chọn đó, không còn nút để đổi.
  if (voted !== null) {
    const Icon = voted === 1 ? ThumbsUp : ThumbsDown;
    return (
      <div className={`flex items-center gap-1.5 text-burgundy ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}>
        <Icon className={`${iconClass} fill-current`} />
        <span>{voted === 1 ? 'Đã đánh giá hữu ích' : 'Cảm ơn góp ý'}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => void send(1)}
          disabled={isPending}
          aria-label="Hữu ích"
          className={`rounded-md ${btnClass} text-navy/30 transition enabled:cursor-pointer enabled:hover:bg-cream-light enabled:hover:text-navy`}
        >
          <ThumbsUp className={iconClass} />
        </button>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={isPending}
          aria-label="Chưa hữu ích"
          className={`rounded-md ${btnClass} text-navy/30 transition enabled:cursor-pointer enabled:hover:bg-cream-light enabled:hover:text-navy`}
        >
          <ThumbsDown className={iconClass} />
        </button>
      </div>

      <FeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(reason, detail) => {
          setModalOpen(false);
          void send(-1, reason, detail);
        }}
        reasons={reasons}
        title={modalTitle}
        description={modalDescription}
        isPending={isPending}
      />
    </>
  );
};
