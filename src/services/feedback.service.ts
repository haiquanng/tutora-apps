import { api } from './api.service';
import type { FeedbackReason } from '../components/ui/FeedbackModal';

/** 1 = thích, -1 = không thích. */
export type VoteValue = 1 | -1;

/** Lý do không hài lòng với LỜI GIẢI*/
export const MESSAGE_REASONS: FeedbackReason[] = [
  { slug: 'sai_dap_an', label: 'Sai đáp án' },
  { slug: 'kho_hieu', label: 'Khó hiểu' },
  { slug: 'sai_lop', label: 'Không hợp trình độ' },
  { slug: 'thieu_buoc', label: 'Thiếu bước giải' },
  { slug: 'khac', label: 'Khác' },
];

export const TUTOR_REASONS: FeedbackReason[] = [
  { slug: 'sai_mon_chuong', label: 'Sai môn / chương' },
  { slug: 'gia_cao', label: 'Giá cao' },
  { slug: 'khong_hop_lich', label: 'Không hợp lịch' },
  { slug: 'khong_can_gia_su', label: 'Mình không cần gia sư' },
  { slug: 'khac', label: 'Khác' },
];

export const voteMessage = (messageId: string, vote: VoteValue, reason?: string, detail?: string) =>
  api.post<unknown>(`/ai-chat/messages/${messageId}/vote`, { body: { vote, reason, detail } });

export interface TutorVotePayload {
  suggestionId: string;
  tutorId: string;
  sessionId?: string;
  vote: VoteValue;
  reason?: string;
  detail?: string;
  chapterSlug?: string;
}

export const voteTutorSuggestion = (payload: TutorVotePayload) =>
  api.post<unknown>('/students/me/tutor-suggestions/vote', { body: payload });
