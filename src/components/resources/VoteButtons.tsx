import { ThumbsDown, ThumbsUp } from 'lucide-react';

interface Props {
  likeCount: number;
  dislikeCount: number;
  helpfulPercent: number;
  /** 1 = đã like, -1 = đã dislike, null = chưa vote. */
  myVote: number | null;
  disabled?: boolean;
  /** Bấm lại chính vote đang chọn -> gửi 0 (bỏ vote). */
  onVote: (vote: 1 | -1 | 0) => void;
}

/** Cụm like/dislike + % hữu ích cho 1 câu hỏi (giống Gauth). */
export const VoteButtons = ({ likeCount, dislikeCount, helpfulPercent, myVote, disabled, onVote }: Props) => {
  const hasVotes = likeCount + dislikeCount > 0;

  const btn = (active: boolean) =>
    `flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
      active
        ? 'border-forest bg-forest/10 text-forest'
        : 'border-navy/10 text-navy/60 hover:border-navy/30 hover:text-navy'
    }`;

  return (
    <div className="flex items-center gap-2">
      {hasVotes && (
        <span className="mr-1 inline-flex items-center gap-1 text-sm font-semibold text-forest">
          <ThumbsUp className="size-4" />
          {helpfulPercent}%
        </span>
      )}

      {/* Đã vote 1 chiều -> ẩn nút chiều kia; chỉ hiện nút đang chọn (bấm lại để bỏ). */}
      {myVote !== -1 && (
        <button
          type="button"
          disabled={disabled}
          aria-pressed={myVote === 1}
          onClick={() => onVote(myVote === 1 ? 0 : 1)}
          className={btn(myVote === 1)}
        >
          <ThumbsUp className="size-4" />
          {likeCount}
        </button>
      )}

      {myVote !== 1 && (
        <button
          type="button"
          disabled={disabled}
          aria-pressed={myVote === -1}
          onClick={() => onVote(myVote === -1 ? 0 : -1)}
          className={btn(myVote === -1)}
        >
          <ThumbsDown className="size-4" />
          {dislikeCount}
        </button>
      )}
    </div>
  );
};
