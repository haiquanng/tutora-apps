import { api } from './api.service';

export interface SuggestedTutor {
  tutorId: string;
  fullName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  teachingMode?: string | null;
  teachingAreaCity?: string | null;
  teachingAreaDistrict?: string | null;
  averageRating: number;
  totalReviews: number;
  totalCompletedLessons: number;
  totalStudentsTaught: number;
  pricePerHour?: number | null;
  subjects: string[];
  profileUrl?: string | null;
}

/** Chương học sinh hỏi nhiều lần trong phiên. */
export interface WeakChapter {
  slug: string;
  name: string;
  count: number;
  subjectId?: number | null;
  gradeLevelId?: number | null;
}

export type CtaMode = 'book' | 'share';

export interface TutorSuggestion {
  shouldShow: boolean;
  skipReason?: string | null;
  ctaMode: CtaMode;
  bannerText: string;
  modalTitle: string;
  modalSubtitle: string;
  weakChapters: WeakChapter[];
  tutors: SuggestedTutor[];
  signalVersion: string;
  suggestionId: string;
  preferenceEnabled?: boolean | null;
  myTutorVotes?: Record<string, number>;
}

export const getTutorSuggestion = (sessionId?: string) =>
  api.get<TutorSuggestion>('/students/me/tutor-suggestions', {
    query: sessionId ? { sessionId } : undefined,
  });

export const setTutorSuggestionEnabled = (enabled: boolean) =>
  api.patch<unknown>('/students/me/preferences', { body: { tutorSuggestionEnabled: enabled } });
