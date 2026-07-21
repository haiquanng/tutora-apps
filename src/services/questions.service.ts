import { api } from './api.service';

export interface PublicQuestion {
  id: string;
  content: string;
  solution: string | null;
  solutionSource: string | null;
  imageUrls: string[];
  difficulty: string | null;
  subjectName: string | null;
  chapterName: string | null;
  questionTypeName: string | null;
  likeCount: number;
  dislikeCount: number;
  helpfulPercent: number;
  myVote: number | null;
  createdAt: string | null;
}

export interface QuestionPage {
  items: PublicQuestion[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface VoteResult {
  questionId: string;
  likeCount: number;
  dislikeCount: number;
  helpfulPercent: number;
  myVote: number | null;
}

export const fetchQuestions = (params: {
  subjectSlug: string;
  chapterSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<QuestionPage> => {
  const { subjectSlug, chapterSlug, page = 1, pageSize = 20 } = params;
  const path = chapterSlug
    ? `/study-resources/${encodeURIComponent(subjectSlug)}/${encodeURIComponent(chapterSlug)}`
    : `/study-resources/${encodeURIComponent(subjectSlug)}`;
  return api.get<QuestionPage>(path, {
    query: { pageNumber: page, pageSize },
    errorMessages: { 404: 'Không tìm thấy môn học hoặc chương.' },
  });
};

export const fetchQuestionById = (questionId: string): Promise<PublicQuestion> =>
  api.get<PublicQuestion>(`/study-resources/questions/${encodeURIComponent(questionId)}`, {
    errorMessages: { 404: 'Không tìm thấy câu hỏi.' },
  });

export const voteQuestion = (questionId: string, vote: 1 | -1 | 0): Promise<VoteResult> =>
  api.post<VoteResult>(`/study-resources/${encodeURIComponent(questionId)}/vote`, {
    body: { vote },
    errorMessages: { 401: 'Cần đăng nhập để đánh giá.', 403: 'Cần đăng nhập để đánh giá.' },
  });
