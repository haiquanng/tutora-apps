export interface SolveRequest {
  text?: string;
  image_base64?: string;
  image_url?: string;
  grade?: number | null;
  chapter?: string | null;
  response_format?: 'markdown' | 'steps';
}

export interface SolveChunk {
  id: string;
  session_id: string;
  delta: string;
  done: boolean;
  /** Các bước vừa hoàn tất trong chunk này (chỉ có khi response_format="steps"). */
  steps?: SolutionStep[];
  /** Danh sách bước đầy đủ, gửi kèm event done -> client thay thế toàn bộ. */
  steps_final?: SolutionStep[];
}

/** 1 bước lời giải hiển thị trên canvas (backend tách sẵn, xem step_segmenter.py). */
export interface SolutionStep {
  index: number;
  title: string;
  /** Phần diễn giải, đã bỏ các block công thức đứng riêng. */
  explanation: string;
  /** Các công thức display-mode ($$...$$) tách riêng để canvas render nổi bật. */
  formulas: string[];
}

export type SubmitMode = 'text' | 'image' | 'camera';

/**
 * Một lượt trong phiên chat: câu hỏi của học sinh + câu trả lời của Tutora.
 *
 * `steps` CHỈ có khi backend nhận ra đây là bài toán (is_problem=true) và tách
 * được các bước. Câu hỏi thường ("bạn giải sinh học không?") thì steps rỗng và
 * chỉ render markdown như chat bình thường — KHÔNG bọc vào thẻ "Bước".
 */
export interface ChatTurn {
  id: string;
  question: string;
  /** Ảnh đề bài (data URL) nếu nộp bằng ảnh. */
  image?: string;
  answer: string;
  steps: SolutionStep[];
  /** Đang stream câu trả lời cho lượt này. */
  isStreaming?: boolean;
}

/** Một phiên hỏi bài, lưu ở history (localStorage). */
export interface HistoryItem {
  id: string;
  sessionId: string;
  /** Câu hỏi đầu tiên — dùng làm tiêu đề ở trang Lịch sử. */
  question: string;
  /** Ảnh thumbnail (data URL) nếu nộp bằng ảnh. */
  thumbnail?: string;
  mode: SubmitMode;
  /** Toàn bộ hội thoại để mở lại là render được ngay. */
  turns: ChatTurn[];
  createdAt: number;
}
