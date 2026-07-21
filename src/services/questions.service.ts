const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5166';

/** 1 câu hỏi mẫu trên trang Tài nguyên (khớp PublicQuestionResponse của BE). */
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

/** Kết quả sau khi vote — số liệu mới để cập nhật card. */
export interface VoteResult {
  questionId: string;
  likeCount: number;
  dislikeCount: number;
  helpfulPercent: number;
  myVote: number | null;
}

const unwrap = <T>(body: unknown): T => {
  const b = body as { content?: T } | T;
  return (b as { content?: T })?.content ?? (b as T);
};

interface RawPage {
  items: PublicQuestion[];
  currentPage?: number;
  CurrentPage?: number;
  pageSize?: number;
  PageSize?: number;
  totalPages?: number;
  TotalPages?: number;
  totalCount?: number;
  TotalCount?: number;
  hasPrevious?: boolean;
  HasPrevious?: boolean;
  hasNext?: boolean;
  HasNext?: boolean;
}

const normalizePage = (raw: RawPage): QuestionPage => ({
  items: raw.items ?? [],
  currentPage: raw.currentPage ?? raw.CurrentPage ?? 1,
  pageSize: raw.pageSize ?? raw.PageSize ?? 20,
  totalPages: raw.totalPages ?? raw.TotalPages ?? 1,
  totalCount: raw.totalCount ?? raw.TotalCount ?? 0,
  hasPrevious: raw.hasPrevious ?? raw.HasPrevious ?? false,
  hasNext: raw.hasNext ?? raw.HasNext ?? false,
});

export const fetchQuestions = async (params: {
  subjectSlug: string;
  chapterSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<QuestionPage> => {
  const { subjectSlug, chapterSlug, page = 1, pageSize = 20 } = params;
  const path = chapterSlug
    ? `/study-resources/${encodeURIComponent(subjectSlug)}/${encodeURIComponent(chapterSlug)}`
    : `/study-resources/${encodeURIComponent(subjectSlug)}`;

  const res = await fetch(`${BACKEND_URL}/api${path}?pageNumber=${page}&pageSize=${pageSize}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) throw new Error('Không tìm thấy môn học hoặc chương.');
  if (!res.ok) throw new Error(`study-resources lỗi ${res.status}`);

  return normalizePage(unwrap<RawPage>(await res.json()));
};

/** Chi tiết 1 câu theo id (cho trang chi tiết). Kèm cookie để có myVote nếu đã login. */
export const fetchQuestionById = async (questionId: string): Promise<PublicQuestion> => {
  const res = await fetch(`${BACKEND_URL}/api/study-resources/questions/${encodeURIComponent(questionId)}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) throw new Error('Không tìm thấy câu hỏi.');
  if (!res.ok) throw new Error(`study-resources lỗi ${res.status}`);
  return unwrap<PublicQuestion>(await res.json());
};

export const voteQuestion = async (questionId: string, vote: 1 | -1 | 0): Promise<VoteResult> => {
  const res = await fetch(`${BACKEND_URL}/api/study-resources/${encodeURIComponent(questionId)}/vote`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ vote }),
  });
  if (res.status === 401 || res.status === 403) {
    const err = new Error('Cần đăng nhập để đánh giá.') as Error & { unauthorized?: boolean };
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) throw new Error(`vote lỗi ${res.status}`);
  return unwrap<VoteResult>(await res.json());
};
