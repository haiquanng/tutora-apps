import { Star, Link2, ExternalLink, CalendarPlus, GraduationCap } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WEB_URL } from '../../services/api.service';
import { VoteButtons } from '../ui/VoteButtons';
import { TUTOR_REASONS, voteTutorSuggestion } from '../../services/feedback.service';
import type { CtaMode, SuggestedTutor } from '../../services/tutorSuggestion.service';

interface Props {
  tutor: SuggestedTutor;
  ctaMode: CtaMode;
  suggestionId?: string;
  sessionId?: string;
  chapterSlug?: string;
  myVote?: 1 | -1 | null;
}

const formatPrice = (price?: number | null) => {
  if (!price) return 'Liên hệ';
  return `${Math.round(price / 1000)}k/giờ`;
};

const profileLink = (tutor: SuggestedTutor) => `${WEB_URL}${tutor.profileUrl ?? `/tutor-detail/${tutor.tutorId}`}`;

export const TutorCard = ({ tutor, ctaMode, suggestionId, sessionId, chapterSlug, myVote }: Props) => {
  const link = profileLink(tutor);
  const qc = useQueryClient();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(
        ctaMode === 'share'
          ? 'Đã sao chép link hồ sơ. Gửi cho bố mẹ để đăng ký nhé!'
          : 'Đã sao chép link hồ sơ gia sư.',
      );
    } catch {
      window.open(link, '_blank', 'noopener');
    }
  };

  const handleOpen = () => window.open(link, '_blank', 'noopener');

  return (
    <div className="flex h-full flex-col rounded-xl border border-navy/10 bg-white p-3">
      <div className="flex items-start gap-3">
        {tutor.avatarUrl ? (
          <img
            src={tutor.avatarUrl}
            alt={tutor.fullName}
            className="size-12 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-cream-light text-navy/40">
            <GraduationCap className="size-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-navy">{tutor.fullName}</p>
          {tutor.totalReviews > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-navy/60">
              <Star className="size-3 fill-gold text-gold" />
              {tutor.averageRating.toFixed(1)}
              <span className="text-navy/40">({tutor.totalReviews})</span>
            </p>
          )}
        </div>

        {suggestionId && (
          <VoteButtons
            size="sm"
            initialVote={myVote}
            reasons={TUTOR_REASONS}
            modalTitle="Gợi ý này chưa phù hợp?"
            modalDescription="Cho mình biết để gợi ý gia sư sát nhu cầu của bạn hơn."
            onVote={async (vote, reason, detail) => {
              await voteTutorSuggestion({
                suggestionId,
                tutorId: tutor.tutorId,
                sessionId,
                vote,
                reason,
                detail,
                chapterSlug,
              });
              void qc.invalidateQueries({ queryKey: ['tutorSuggestion'] });
            }}
          />
        )}
      </div>

      {tutor.headline && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-navy/60">{tutor.headline}</p>}

      {tutor.subjects.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tutor.subjects.slice(0, 2).map((s) => (
            <span key={s} className="rounded-full bg-cream-light px-2 py-0.5 text-[11px] text-navy/60">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-3">
        <p className="text-sm font-medium text-burgundy">{formatPrice(tutor.pricePerHour)}</p>

        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={handleOpen}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-navy/12 px-3 py-1.5 text-xs font-medium text-navy transition hover:border-gold hover:bg-gold/10 hover:text-burgundy"
          >
            {ctaMode === 'share' ? (
              <>
                <ExternalLink className="size-3.5" />
                Xem hồ sơ
              </>
            ) : (
              <>
                <CalendarPlus className="size-3.5" />
                Đặt lịch học
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy link hồ sơ"
            title="Copy link hồ sơ"
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-navy/12 px-2.5 py-1.5 text-navy/60 transition hover:border-gold hover:bg-gold/10 hover:text-burgundy"
          >
            <Link2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
