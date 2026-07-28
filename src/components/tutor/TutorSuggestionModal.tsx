import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { TutorCard } from './TutorCard';
import type { TutorSuggestion } from '../../services/tutorSuggestion.service';

const voteOf = (v?: number): 1 | -1 | null => (v === 1 ? 1 : v === -1 ? -1 : null);

interface Props {
  open: boolean;
  onClose: () => void;
  suggestion: TutorSuggestion;
  sessionId?: string;
}

export const TutorSuggestionModal = ({ open, onClose, suggestion, sessionId }: Props) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const showNav = suggestion.tutors.length > 2;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{suggestion.modalTitle}</DialogTitle>
        <DialogDescription>{suggestion.modalSubtitle}</DialogDescription>

        {suggestion.weakChapters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {suggestion.weakChapters.map((c) => (
              <span
                key={c.slug}
                className="rounded-full border border-gold bg-gold/10 px-2.5 py-1 text-xs text-burgundy"
              >
                {c.name}
                <span className="ml-1 text-burgundy/60">{c.count} bài</span>
              </span>
            ))}
          </div>
        )}

        <div className="relative mt-4">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 scrollbar-none"
          >
            {suggestion.tutors.map((tutor) => (
              <div key={tutor.tutorId} className="w-56 shrink-0 snap-start sm:w-60">
                <TutorCard
                  tutor={tutor}
                  ctaMode={suggestion.ctaMode}
                  suggestionId={suggestion.suggestionId}
                  sessionId={sessionId}
                  chapterSlug={suggestion.weakChapters[0]?.slug}
                  myVote={voteOf(suggestion.myTutorVotes?.[tutor.tutorId])}
                />
              </div>
            ))}
          </div>

          {showNav && (
            <>
              <button
                type="button"
                aria-label="Gia sư trước"
                onClick={() => scrollByPage(-1)}
                className="absolute -left-3 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full border border-navy/10 bg-white p-1.5 text-navy/50 transition hover:border-gold hover:text-navy sm:block"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Gia sư tiếp theo"
                onClick={() => scrollByPage(1)}
                className="absolute -right-3 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full border border-navy/10 bg-white p-1.5 text-navy/50 transition hover:border-gold hover:text-navy sm:block"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>

        {suggestion.ctaMode === 'share' && (
          <p className="mt-3 rounded-lg bg-cream-light px-3 py-2 text-xs leading-relaxed text-navy/60">
            Tài khoản của bạn cần phụ huynh đăng ký giúp. Bấm biểu tượng 🔗 để copy link hồ sơ rồi gửi cho bố mẹ nhé!
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
