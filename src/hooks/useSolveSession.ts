import { useCallback, useEffect, useRef, useState } from 'react';
import { streamSolve } from '../services/solve.service';
import { consumeQuota, getQuota } from '../services/quota.service';
import { saveHistoryItem } from '../services/history.service';
import type { ChatTurn, HistoryItem, SolveMessage, SubmitMode } from '../types/solve';

export interface SubmitPayload {
  mode: SubmitMode;
  /** Đề bài dạng chữ (mode 'text'). */
  text?: string;
  /** Ảnh data URL (mode 'image' | 'camera'). */
  imageDataUrl?: string;
}

interface Options {
  /** Gọi khi bắt đầu 1 phiên mới -> trang điều hướng sang /c/:id. */
  onSessionStart?: (chatId: string) => void;
}

/**
 * Quản lý 1 PHIÊN CHAT liên tục (như Claude/GPT), không phải từng bài rời rạc.
 *
 * Mỗi lượt hỏi -> thêm 1 ChatTurn vào danh sách. Backend chỉ trả `steps` khi
 * nhận ra là bài toán; câu hỏi thường thì turn chỉ có markdown và UI render
 * dạng chat bình thường.
 */
export const useSolveSession = ({ onSessionStart }: Options = {}) => {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState(getQuota);

  const sessionIdRef = useRef<string>('');
  const historyRef = useRef<SolveMessage[]>([]);
  const abortRef = useRef<(() => void) | null>(null);
  const modeRef = useRef<SubmitMode>('text');
  const turnsRef = useRef<ChatTurn[]>([]);

  // Huỷ stream đang chạy khi unmount để tránh setState trên component đã gỡ.
  useEffect(() => () => abortRef.current?.(), []);

  // Giữ bản mới nhất cho persist (đọc trong callback của stream).
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const persist = useCallback((allTurns: ChatTurn[]) => {
    const first = allTurns[0];
    if (!sessionIdRef.current || !first) return;
    saveHistoryItem({
      id: sessionIdRef.current,
      sessionId: sessionIdRef.current,
      question: first.question,
      thumbnail: first.image,
      mode: modeRef.current,
      turns: allTurns,
      createdAt: Date.now(),
    });
  }, []);

  /** Cập nhật lượt đang stream (luôn là lượt cuối). */
  const patchLastTurn = useCallback((patch: Partial<ChatTurn>) => {
    setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, ...patch } : t)));
  }, []);

  /**
   * Gửi 1 lượt hỏi. `isNewSession` = true -> reset phiên và tạo chat_id mới;
   * false -> hỏi tiếp trong phiên hiện tại (giữ chat_id + history).
   */
  const send = useCallback(
    (payload: SubmitPayload, isNewSession: boolean) => {
      const ask = payload.text?.trim() || 'Giải giúp mình bài trong ảnh này.';
      if (isStreaming) return;
      if (getQuota().isExhausted) {
        setError('Bạn đã dùng hết lượt hỏi trong kỳ này.');
        return;
      }

      abortRef.current?.();
      setError(null);
      setIsStreaming(true);

      if (isNewSession) {
        historyRef.current = [];
        // Sinh id ngay ở FE để điều hướng sang /c/:id trước khi backend trả lời.
        sessionIdRef.current = crypto.randomUUID();
        modeRef.current = payload.mode;
        setTurns([]);
        onSessionStart?.(sessionIdRef.current);
      }

      const turn: ChatTurn = {
        id: crypto.randomUUID(),
        question: ask,
        image: payload.imageDataUrl,
        answer: '',
        steps: [],
        isStreaming: true,
      };
      setTurns((prev) => [...prev, turn]);

      abortRef.current = streamSolve(
        {
          text: payload.text,
          // Backend nhận base64 thuần, không kèm prefix "data:image/...;base64,".
          image_base64: payload.imageDataUrl?.split(',')[1],
          chat_id: sessionIdRef.current || undefined,
          history: historyRef.current,
          response_format: 'steps',
        },
        {
          onDelta: (accumulated) => patchLastTurn({ answer: accumulated }),
          onSteps: (incoming) =>
            setTurns((prev) =>
              prev.map((t, i) => (i === prev.length - 1 ? { ...t, steps: [...t.steps, ...incoming] } : t)),
            ),
          onDone: (final, sessionId, finalSteps) => {
            sessionIdRef.current = sessionId || sessionIdRef.current;
            historyRef.current = [
              ...historyRef.current,
              { role: 'user', content: ask },
              { role: 'assistant', content: final },
            ];

            // finalSteps rỗng = câu hỏi thường -> giữ steps rỗng, UI render markdown.
            const next = turnsRef.current.map((t, i) =>
              i === turnsRef.current.length - 1
                ? { ...t, answer: final, steps: finalSteps ?? [], isStreaming: false }
                : t,
            );
            setTurns(next);
            setIsStreaming(false);
            setQuota(consumeQuota());
            persist(next);
          },
          onError: (err) => {
            setError(err.message);
            setIsStreaming(false);
            patchLastTurn({ isStreaming: false });
          },
        },
      );
    },
    [isStreaming, onSessionStart, patchLastTurn, persist],
  );

  /** Bài mới — reset phiên. */
  const submit = useCallback((payload: SubmitPayload) => send(payload, true), [send]);

  /** Hỏi tiếp trong phiên hiện tại (giữ ngữ cảnh). */
  const sendFollowUp = useCallback(
    (ask: string, imageDataUrl?: string) =>
      send({ mode: imageDataUrl ? 'image' : 'text', text: ask, imageDataUrl }, false),
    [send],
  );

  /** Nút "Giải thích kỹ hơn" ở một bước. */
  const askAboutStep = useCallback(
    (step: { index: number; title: string }, customQuestion?: string) => {
      sendFollowUp(
        customQuestion?.trim() ||
          `Giải thích kỹ hơn giúp mình "${step.title}" (bước ${step.index + 1}): vì sao làm vậy và áp dụng công thức nào?`,
      );
    },
    [sendFollowUp],
  );

  const reset = useCallback(() => {
    abortRef.current?.();
    historyRef.current = [];
    sessionIdRef.current = '';
    setTurns([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  /** Mở lại 1 phiên trong lịch sử — hỏi tiếp được vì khôi phục cả history. */
  const loadFromHistory = useCallback((item: HistoryItem) => {
    abortRef.current?.();
    sessionIdRef.current = item.sessionId;
    modeRef.current = item.mode;
    // item.turns có thể thiếu ở bản ghi cũ (trước khi đổi sang mô hình chat) -> phòng thủ.
    const restored = item.turns ?? [];
    historyRef.current = restored.flatMap((t) => [
      { role: 'user' as const, content: t.question },
      { role: 'assistant' as const, content: t.answer },
    ]);
    setTurns(restored);
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    turns,
    isStreaming,
    error,
    quota,
    submit,
    sendFollowUp,
    askAboutStep,
    reset,
    loadFromHistory,
  };
};
