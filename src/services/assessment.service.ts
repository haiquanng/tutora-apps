import { api } from './api.service';

/** GET /api/assessments/available */
export interface AvailableAssessment {
  id: string;
  title: string;
  description: string | null;
  subjectId: number;
  subjectName: string | null;
  gradeLevelId: number;
  gradeName: string | null;
  questionCount: number;
  durationMinutes: number | null;
}

export type QuestionFormat = 'single_choice' | 'multi_choice' | 'true_false' | 'short_answer' | 'essay';

export interface AnswerOption {
  key: string;
  text: string;
}

export interface AttemptQuestion {
  id: string;
  displayOrder: number;
  points: number;
  questionFormat: QuestionFormat;
  content: string;
  answerOptions: AnswerOption[] | null;
  imageUrls: string[];
  /** Có giá trị khi tiếp tục bài đang làm dở. */
  givenAnswer: string | null;
}

export interface AttemptInProgress {
  attemptId: string;
  assessmentId: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  gradeName: string | null;
  durationMinutes: number | null;
  startedAt: string;
  /** Null = không giới hạn thời gian. */
  expiresAt: string | null;
  questions: AttemptQuestion[];
}

export interface AttemptAnswerResult {
  questionId: string;
  displayOrder: number;
  content: string;
  questionFormat: QuestionFormat;
  answerOptions: AnswerOption[] | null;
  givenAnswer: string | null;
  isCorrect: boolean;
  earnedPoints: number;
  points: number;
  correctAnswer: string | null;
  explanation: string | null;
  chapterName: string | null;
  difficulty: string | null;
}

export interface AttemptResult {
  attemptId: string;
  assessmentId: string;
  title: string;
  subjectName: string | null;
  gradeName: string | null;
  status: string;
  totalQuestions: number;
  correctCount: number;
  earnedPoints: number;
  maxPoints: number;
  scorePercent: number | null;
  durationSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
  analysisStatus: 'pending' | 'processing' | 'done' | 'failed';
  analysisSummary: string | null;
  analysisResult: string | null;
  analyzedAt: string | null;
  /** Chỉ gác phần ĐIỂM — đáp án luôn xem được. */
  showResult: boolean;
  answers: AttemptAnswerResult[];
}

export interface ProficiencyProfile {
  id: string;
  userId: string;
  subjectId: number;
  subjectName: string | null;
  gradeLevelId: number | null;
  gradeName: string | null;
  level: 'beginner' | 'developing' | 'proficient' | 'advanced' | null;
  summary: string | null;
  /** JSON string — parse bằng parseProfile. */
  strengths: string | null;
  weaknesses: string | null;
  recommendedPath: string | null;
  sourceAttemptId: string | null;
  attemptCount: number;
  updatedAt: string | null;
}

// Khối JSON do AI sinh (xem app/services/assessment/analyzer.py SCHEMA).

export interface ChapterNote {
  chapter: string;
  chapterSlug: string | null;
  note?: string;
}

export interface Weakness extends ChapterNote {
  severity?: 'minor' | 'moderate' | 'critical';
}

/** 1 dạng bài nên luyện để gỡ lỗ hổng của chương. */
export interface ImproveItem {
  title: string;
  why?: string;
}

/**
 * Mức thông thạo 1 chương. CỐ Ý không có thang %/điểm số: đề ít câu nên phần trăm
 * tạo cảm giác chính xác giả (2/3 câu không phải "thông thạo 67%"). Chỉ 3 mức verdict.
 */
export interface ChapterMastery extends ChapterNote {
  correct: number;
  total: number;
  verdict?: 'solid' | 'shaky' | 'gap';
  summary?: string;
  improve?: ImproveItem[];
}

export interface PathStep extends ChapterNote {
  order: number;
  goal?: string;
  why?: string;
  practice?: string[];
  estimatedSessions?: number;
}

export interface Analysis {
  level: ProficiencyProfile['level'];
  summary: string;
  confidence: 'low' | 'medium' | 'high' | null;
  strengths: ChapterNote[];
  weaknesses: Weakness[];
  chapter_mastery: ChapterMastery[];
  recommended_path: PathStep[];
  next_action: string | null;
}

const BASE = '/assessments';

export const fetchAvailableAssessments = (params: { subjectId?: number; gradeLevelId?: number } = {}) =>
  api.get<AvailableAssessment[]>(`${BASE}/available`, { query: params }).then((r) => r ?? []);

/** Khảo sát xong -> BE tự random 1 đề khớp môn/lớp rồi bắt đầu. */
export const startRandomAttempt = (subjectId: number, gradeLevelId?: number) =>
  api.post<AttemptInProgress>(`${BASE}/start-random`, {
    body: { subjectId, gradeLevelId: gradeLevelId ?? null },
    errorMessages: { 400: 'Chưa có đề đánh giá cho môn này.' },
  });

export const startAttempt = (assessmentId: string) =>
  api.post<AttemptInProgress>(`${BASE}/${assessmentId}/attempts`, { body: {} });

export const submitAttempt = (
  attemptId: string,
  answers: { questionId: string; givenAnswer: string | null; timeSpentSeconds?: number }[],
) => api.post<AttemptResult>(`${BASE}/attempts/${attemptId}/submit`, { body: { answers } });

export const fetchAttemptResult = (attemptId: string) => api.get<AttemptResult>(`${BASE}/attempts/${attemptId}`);

export const fetchProficiency = (subjectId?: number) =>
  api.get<ProficiencyProfile[]>(`${BASE}/me/proficiency`, { query: { subjectId } }).then((r) => r ?? []);

/**
 * Chạy phân tích AI. BE gộp cả 3 chặng (dữ kiện thô -> tutora-ai -> ghi profile) nên FE
 * chỉ gọi 1 lần; API key của AI không lộ ra client.
 */
export const runAnalysis = async (attemptId: string): Promise<Analysis | null> => {
  const res = await api.post<{ attemptId: string; analysis: string | null }>(`${BASE}/attempts/${attemptId}/analyze`, {
    errorMessages: { 502: 'AI đang không phản hồi. Bài làm vẫn được giữ, thử lại sau nhé.' },
  });
  return parseAnalysisResult(res?.analysis ?? null);
};

/** Profile -> Analysis khi không có analysisResult (mindmap thiếu chapter_mastery). */
export const parseProfile = (profile: ProficiencyProfile): Analysis => {
  const read = <T>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return (JSON.parse(raw) ?? fallback) as T;
    } catch {
      return fallback;
    }
  };

  return {
    level: profile.level,
    summary: profile.summary ?? '',
    confidence: null,
    strengths: read<ChapterNote[]>(profile.strengths, []),
    weaknesses: read<Weakness[]>(profile.weaknesses, []),
    chapter_mastery: [],
    recommended_path: read<PathStep[]>(profile.recommendedPath, []),
    next_action: null,
  };
};

/** Analysis đầy đủ từ attempt.analysisResult (có chapter_mastery cho mindmap). */
export const parseAnalysisResult = (raw: string | null): Analysis | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Analysis>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      level: parsed.level ?? null,
      summary: parsed.summary ?? '',
      confidence: parsed.confidence ?? null,
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      chapter_mastery: parsed.chapter_mastery ?? [],
      recommended_path: parsed.recommended_path ?? [],
      next_action: parsed.next_action ?? null,
    };
  } catch {
    return null;
  }
};

export interface AttemptHistoryPage {
  items: AttemptResult[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Lịch sử làm bài. BE trả nguyên AttemptResultResponse cho mỗi lượt (kèm cả answers),
 * nên list này đủ dữ liệu hiển thị mà KHÔNG cần gọi thêm; trang xem lại vẫn tự fetch
 * theo attemptId để reload thẳng URL vẫn chạy.
 */
export const fetchAttemptHistory = (params: { pageNumber?: number; pageSize?: number; subjectId?: number } = {}) =>
  api
    .get<AttemptHistoryPage>(`${BASE}/attempts`, {
      query: {
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
        subjectId: params.subjectId,
      },
    })
    .then(
      (r) =>
        r ?? {
          items: [],
          currentPage: 1,
          pageSize: 20,
          totalPages: 0,
          totalCount: 0,
          hasPrevious: false,
          hasNext: false,
        },
    );
