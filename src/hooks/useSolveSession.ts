import { useCallback, useEffect, useRef, useState } from 'react';
import { streamSolve } from '../services/solve.service';
import { consumeQuota, getQuota } from '../services/quota.service';
import { createSession } from '../services/history.service';
import type { ChatTurn, HistoryItem, SubmitMode } from '../types/solve';

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

export const useSolveSession = ({ onSessionStart }: Options = {}) => {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState(getQuota);

  const sessionIdRef = useRef<string>('');
  const abortRef = useRef<(() => void) | null>(null);
  const modeRef = useRef<SubmitMode>('text');
  const turnsRef = useRef<ChatTurn[]>([]);

  // Huỷ stream đang chạy khi unmount để tránh setState trên component đã gỡ.
  useEffect(() => () => abortRef.current?.(), []);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  /** Cập nhật lượt đang stream (luôn là lượt cuối). */
  const patchLastTurn = useCallback((patch: Partial<ChatTurn>) => {
    setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, ...patch } : t)));
  }, []);

  /**
   * Gửi 1 lượt hỏi. `isNewSession` = true -> tạo phiên mới ở BE;
   * false -> hỏi tiếp trong phiên hiện tại. BE tự lưu message + dựng history.
   */
  const send = useCallback(
    async (payload: SubmitPayload, isNewSession: boolean) => {
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
        modeRef.current = payload.mode;
        setTurns([]);
        try {
          // Phiên phải tồn tại ở BE trước khi stream (BE kiểm quyền sở hữu).
          const session = await createSession(ask.slice(0, 100));
          sessionIdRef.current = session.sessionId;
          onSessionStart?.(session.sessionId);
        } catch {
          setError('Không tạo được phiên hỏi bài. Vui lòng thử lại.');
          setIsStreaming(false);
          return;
        }
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
        sessionIdRef.current,
        {
          text: payload.text,
          // Backend nhận base64 thuần, không kèm prefix "data:image/...;base64,".
          image_base64: payload.imageDataUrl?.split(',')[1],
          response_format: 'steps',
        },
        {
          onDelta: (accumulated) => patchLastTurn({ answer: accumulated }),
          onSteps: (incoming) =>
            setTurns((prev) =>
              prev.map((t, i) => (i === prev.length - 1 ? { ...t, steps: [...t.steps, ...incoming] } : t)),
            ),
          onDone: (final, _sessionId, finalSteps) => {
            // finalSteps rỗng = câu hỏi thường -> giữ steps rỗng, UI render markdown.
            const next = turnsRef.current.map((t, i) =>
              i === turnsRef.current.length - 1
                ? { ...t, answer: final, steps: finalSteps ?? [], isStreaming: false }
                : t,
            );
            setTurns(next);
            setIsStreaming(false);
            setQuota(consumeQuota());
          },
          onError: (err) => {
            setError(err.message);
            setIsStreaming(false);
            patchLastTurn({ isStreaming: false });
          },
        },
      );
    },
    [isStreaming, onSessionStart, patchLastTurn],
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
    sessionIdRef.current = '';
    setTurns([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  /** Mở lại 1 phiên trong lịch sử — hỏi tiếp được vì BE giữ ngữ cảnh theo session. */
  const loadFromHistory = useCallback((item: HistoryItem) => {
    abortRef.current?.();
    sessionIdRef.current = item.sessionId;
    modeRef.current = item.mode;
    setTurns(item.turns ?? []);
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
