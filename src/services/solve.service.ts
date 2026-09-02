import type { AnswerTrust, SolutionStep, SolveChunk, SolveRequest, TopicClassification } from '../types/solve';
import { authHeader, BACKEND_URL, handleSessionExpired, refreshAccessToken } from './api.service';

export interface StreamHandlers {
  onDelta: (accumulated: string, delta: string) => void;
  onThinking?: (accumulated: string, delta: string) => void;
  /** Backend vừa chốt xong một số bước -> nối vào canvas. */
  onSteps?: (steps: SolutionStep[]) => void;
  onDone: (
    final: string,
    sessionId: string,
    steps?: SolutionStep[],
    messageId?: string,
    classification?: TopicClassification,
    trust?: AnswerTrust,
  ) => void;
  onError: (error: Error) => void;
}

export class OutOfCreditError extends Error {
  constructor() {
    super('Bạn đã hết lượt hỏi AI. Vui lòng nâng cấp để tiếp tục.');
    this.name = 'OutOfCreditError';
  }
}

/**
 * Stream lời giải qua BE: POST /api/ai-chat/sessions/{id}/solve.
 * @returns hàm abort để huỷ stream giữa chừng.
 */
export const streamSolve = (sessionId: string, body: SolveRequest, handlers: StreamHandlers): (() => void) => {
  const controller = new AbortController();

  const run = async () => {
    const url = `${BACKEND_URL}/api/ai-chat/sessions/${encodeURIComponent(sessionId)}/solve`;
    const payload = JSON.stringify(body);

    const fire = (token?: string) =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : authHeader()),
        },
        credentials: 'include',
        body: payload,
        signal: controller.signal,
      });

    let response = await fire();

    // Access token sống 1h; stream dài + để tab lâu là dính 401. Refresh rồi gửi lại.
    if (response.status === 401) {
      const token = await refreshAccessToken();
      if (token) {
        response = await fire(token);
        if (response.status === 401) handleSessionExpired();
      } else {
        handleSessionExpired();
      }
    }

    if (response.status === 402) {
      throw new OutOfCreditError();
    }
    if (!response.ok || !response.body) {
      // Message này hiện thẳng cho học sinh -> không lộ mã HTTP.
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'Bạn cần đăng nhập để dùng tính năng này.'
          : 'Không gửi được bài. Bạn kiểm tra mạng rồi thử lại nhé.',
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    let thinking = '';
    let messageId: string | undefined;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE: các event ngăn cách bởi dòng trống. Phần dư giữ lại chờ chunk sau.
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        const line = event.split('\n').find((l) => l.startsWith('data:'));
        if (!line) continue;

        let chunk: SolveChunk;
        try {
          chunk = JSON.parse(line.slice(5).trim());
        } catch {
          continue; // event lỗi -> bỏ qua, không làm gãy cả stream
        }

        if (chunk.id) messageId = chunk.id;

        if (chunk.thinking) {
          thinking += chunk.thinking;
          handlers.onThinking?.(thinking, chunk.thinking);
        }
        if (chunk.delta) {
          accumulated += chunk.delta;
          handlers.onDelta(accumulated, chunk.delta);
        }
        if (chunk.steps?.length) {
          handlers.onSteps?.(chunk.steps);
        }
        if (chunk.done) {
          handlers.onDone(accumulated, sessionId, chunk.steps_final, messageId, chunk.classification, {
            bankVerified: chunk.bank_verified,
            ragUsed: chunk.rag_used,
            verified: chunk.verified,
            similarity: chunk.bank_similarity,
            questionId: chunk.bank_question_id,
          });
          return;
        }
      }
    }

    // Stream đóng mà chưa có event done -> vẫn chốt bằng nội dung đã nhận.
    handlers.onDone(accumulated, sessionId, undefined, messageId);
  };

  run().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    handlers.onError(error instanceof Error ? error : new Error('Unknown error'));
  });

  return () => controller.abort();
};
