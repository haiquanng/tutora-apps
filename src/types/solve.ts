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
