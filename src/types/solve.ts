export interface SolveRequest {
  text?: string;
  imageBase64?: string;
  imageUrl?: string;
  grade?: string | null;
  chapter?: string | null;
  responseFormat?: 'markdown' | 'steps';
}

export interface TopicClassification {
  grade?: string | null;
  chapter?: string | null;
  topic?: string | null;
  confidence?: number;
}

export interface SolveChunk {
  id?: string;
  session_id?: string;
  delta?: string;
  done?: boolean;
  thinking?: string;
  steps?: SolutionStep[];
  steps_final?: SolutionStep[];
  classification?: TopicClassification;
  rag_used?: boolean;
  bank_verified?: boolean;
  bank_similarity?: number | null;
  bank_question_id?: string | null;
  verified?: boolean | null;
}

/** Mức tin cậy của một lời giải — quyết định nhãn hiện trên UI. */
export interface AnswerTrust {
  /** Trùng khít câu gia sư đã duyệt (similarity >= 0.97). */
  bankVerified?: boolean;
  /** Có bài mẫu đã duyệt để tham chiếu, nhưng chưa trùng khít. */
  ragUsed?: boolean;
  /** null = không kết luận được (hình học/chứng minh) -> không hiện nhãn. */
  verified?: boolean | null;
  similarity?: number | null;
  /** Câu gốc trong bank -> mở để đối chiếu. */
  questionId?: string | null;
}

/** 1 bước lời giải hiển thị trên canvas (backend tách sẵn, xem step_segmenter.py). */
export interface SolutionStep {
  index: number;
  title: string;
  explanation: string;
  formulas: string[];
  goal?: string;
  detailed?: string;
  hints?: string[];
}

export type SubmitMode = 'text' | 'image' | 'camera';

export interface ChatTurn {
  id: string;
  messageId?: string;
  classification?: TopicClassification;
  myVote?: 1 | -1;
  question: string;
  image?: string;
  answer: string;
  steps: SolutionStep[];
  thinking?: string;
  isStreaming?: boolean;
  noteSaved?: boolean;
  trust?: AnswerTrust;
}

/** Một phiên hỏi bài, lưu ở history (localStorage). */
export interface HistoryItem {
  id: string;
  sessionId: string;
  question: string;
  thumbnail?: string;
  mode: SubmitMode;
  turns: ChatTurn[];
  createdAt: number;
}
