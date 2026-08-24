import { api } from './api.service';

/** Câu mời luyện — dạng TỰ LUẬN, học sinh tự làm rồi đối chiếu lời giải mẫu. */
export interface PracticeQuestion {
  questionId: string;
  content: string;
  solution: string | null;
  chapterName: string | null;
  difficulty: string | null;
}

/** UI chỉ hỏi giải được hay chưa. BE vẫn chấp nhận 'partial' cho dữ liệu cũ. */
export type SelfAssessment = 'correct' | 'wrong';

/**
 * Bài luyện tương tự bài vừa hỏi
 */
export const fetchNextPractice = (params: {
  chapter: string;
  questionText?: string;
  difficulty?: string;
}): Promise<PracticeQuestion | null> =>
  api
    .get<PracticeQuestion | null>('/practice/next', { query: params })
    .then((r) => r ?? null)
    .catch(() => null);

/** Ghi nhận lượt luyện. Không trả thống kê — đây không phải app tracking học tập. */
export const submitPractice = (body: {
  questionId: string;
  selfAssessment: SelfAssessment;
  sourceSessionId?: string;
}): Promise<void> => api.post<void>('/practice/submit', { body });
