import type { SolutionStep, SolveChunk, SolveRequest } from '../types/solve';
import { AI_URL } from './api.service';

export interface StreamHandlers {
  onDelta: (accumulated: string, delta: string) => void;
  /** Backend vừa chốt xong một số bước -> nối vào canvas. */
  onSteps?: (steps: SolutionStep[]) => void;
  onDone: (final: string, sessionId: string, steps?: SolutionStep[]) => void;
  onError: (error: Error) => void;
}

/**
 * Gọi POST /api/v1/solve và đọc SSE stream.
 *
 * Không dùng EventSource vì endpoint là POST (EventSource chỉ GET) — đọc trực tiếp
 * ReadableStream rồi tự tách event theo "\n\n".
 *
 * @returns hàm abort để huỷ stream giữa chừng.
 */
export const streamSolve = (body: SolveRequest, handlers: StreamHandlers): (() => void) => {
  const controller = new AbortController();

  const run = async () => {
    const response = await fetch(`${AI_URL}/api/v1/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Phiên nằm ở cookie .tutora.vn (xem auth.service), không phải Bearer token.
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Solve failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    let sessionId = body.chat_id || '';

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

        sessionId = chunk.session_id || sessionId;
        if (chunk.delta) {
          accumulated += chunk.delta;
          handlers.onDelta(accumulated, chunk.delta);
        }
        if (chunk.steps?.length) {
          handlers.onSteps?.(chunk.steps);
        }
        if (chunk.done) {
          handlers.onDone(accumulated, sessionId, chunk.steps_final);
          return;
        }
      }
    }

    // Stream đóng mà chưa có event done -> vẫn chốt bằng nội dung đã nhận.
    handlers.onDone(accumulated, sessionId);
  };

  run().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    handlers.onError(error instanceof Error ? error : new Error('Unknown error'));
  });

  return () => controller.abort();
};
