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

/** Mirror AssessmentQuestionFormat.IsScored ở BE — sửa hai bên cùng lúc. */
export const isScoredFormat = (format: QuestionFormat | string): boolean =>
  format === 'single_choice' || format === 'multi_choice' || format === 'true_false';

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
export type Verdict = 'solid' | 'shaky' | 'gap';

export interface ChapterMastery extends ChapterNote {
  correct: number;
  total: number;
  verdict?: Verdict;
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

/*
 * Chuẩn hoá JSON do AI (Gemini) sinh
 */

const asArray = (raw: unknown): unknown[] => (Array.isArray(raw) ? raw : []);
const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  !!raw && typeof raw === 'object' && !Array.isArray(raw);

/** Chuỗi không rỗng, hoặc undefined. Số/null từ AI cũng bị loại. */
const asText = (raw: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim();
  return text || undefined;
};

const asNumber = (raw: unknown): number => {
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
};

/** Enum AI trả: khớp không phân biệt hoa thường, không khớp -> undefined. */
const asEnum = <T extends string>(raw: unknown, allowed: readonly T[]): T | undefined => {
  const text = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return allowed.find((v) => v === text);
};

/**
 * Verdict từng gặp AI trả 'weak'/'strong'/'Gap'/nhãn lạ. Quy về đúng 3 mức ngay
 * tại chỗ parse để UI không index bảng màu bằng key không tồn tại.
 */
const VERDICT_ALIAS: Record<string, Verdict> = {
  solid: 'solid',
  strong: 'solid',
  good: 'solid',
  mastered: 'solid',
  shaky: 'shaky',
  medium: 'shaky',
  moderate: 'shaky',
  partial: 'shaky',
  gap: 'gap',
  weak: 'gap',
  poor: 'gap',
  missing: 'gap',
};

export const parseVerdict = (raw: unknown): Verdict | undefined =>
  typeof raw === 'string' ? VERDICT_ALIAS[raw.trim().toLowerCase()] : undefined;

/**
 * Mức thông thạo dùng chung cho mindmap và panel chi tiết: verdict AI nếu hợp lệ,
 * không thì suy từ số câu đúng thật. Ưu tiên "chưa chắc" khi còn câu sai để không tô hồng.
 */
export const verdictOf = (item: ChapterMastery): Verdict => {
  const fromAi = parseVerdict(item.verdict);
  if (fromAi) return fromAi;
  if (item.total > 0 && item.correct === item.total) return 'solid';
  return item.correct > 0 ? 'shaky' : 'gap';
};

/** Chương không có tên thì bỏ hẳn: UI lấy tên làm tiêu đề và làm key. */
const toChapterNote = (raw: unknown): ChapterNote | null => {
  if (!isRecord(raw)) return null;
  const chapter = asText(raw.chapter);
  if (!chapter) return null;
  return { chapter, chapterSlug: asText(raw.chapterSlug) ?? null, note: asText(raw.note) };
};

const toChapterNotes = (raw: unknown): ChapterNote[] =>
  asArray(raw)
    .map(toChapterNote)
    .filter((item): item is ChapterNote => item !== null);

const SEVERITIES = ['minor', 'moderate', 'critical'] as const;

export const toWeaknesses = (raw: unknown): Weakness[] =>
  asArray(raw).flatMap((item) => {
    const note = toChapterNote(item);
    if (!note) return [];
    return [{ ...note, severity: asEnum(isRecord(item) ? item.severity : null, SEVERITIES) }];
  });

const toImprove = (raw: unknown): ImproveItem[] =>
  asArray(raw).flatMap((item) => {
    if (!isRecord(item)) return [];
    const title = asText(item.title);
    return title ? [{ title, why: asText(item.why) }] : [];
  });

const toMastery = (raw: unknown): ChapterMastery[] =>
  asArray(raw).flatMap((item) => {
    const note = toChapterNote(item);
    if (!note || !isRecord(item)) return [];
    return [
      {
        ...note,
        correct: asNumber(item.correct),
        total: asNumber(item.total),
        verdict: parseVerdict(item.verdict),
        summary: asText(item.summary),
        improve: toImprove(item.improve),
      },
    ];
  });

/** practice: chỉ giữ chuỗi — RoadmapSteps dùng chính phần tử làm React key. */
const toPractice = (raw: unknown): string[] =>
  asArray(raw)
    .map(asText)
    .filter((item): item is string => !!item);

export const toPathSteps = (raw: unknown): PathStep[] =>
  asArray(raw).flatMap((item, i) => {
    const note = toChapterNote(item);
    if (!note || !isRecord(item)) return [];
    return [
      {
        ...note,
        order: asNumber(item.order) || i + 1,
        goal: asText(item.goal),
        why: asText(item.why),
        practice: toPractice(item.practice),
        estimatedSessions: asNumber(item.estimatedSessions) || undefined,
      },
    ];
  });

const LEVELS = ['beginner', 'developing', 'proficient', 'advanced'] as const;
const CONFIDENCES = ['low', 'medium', 'high'] as const;

/**
 * Profile -> Analysis khi không có analysisResult (mindmap thiếu chapter_mastery).
 * Các cột JSON này cũng do AI sinh ra rồi mới ghi DB, nên chuẩn hoá y như analysisResult.
 */
export const parseProfile = (profile: ProficiencyProfile): Analysis => {
  const read = (raw: string | null): unknown => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  return {
    level: profile.level,
    summary: profile.summary ?? '',
    confidence: null,
    strengths: toChapterNotes(read(profile.strengths)),
    weaknesses: toWeaknesses(read(profile.weaknesses)),
    chapter_mastery: [],
    recommended_path: toPathSteps(read(profile.recommendedPath)),
    next_action: null,
  };
};

/** Analysis đầy đủ từ attempt.analysisResult (có chapter_mastery cho mindmap). */
export const parseAnalysisResult = (raw: string | null): Analysis | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    return {
      level: asEnum(parsed.level, LEVELS) ?? null,
      summary: asText(parsed.summary) ?? '',
      confidence: asEnum(parsed.confidence, CONFIDENCES) ?? null,
      strengths: toChapterNotes(parsed.strengths),
      weaknesses: toWeaknesses(parsed.weaknesses),
      chapter_mastery: toMastery(parsed.chapter_mastery),
      recommended_path: toPathSteps(parsed.recommended_path),
      next_action: asText(parsed.next_action) ?? null,
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
