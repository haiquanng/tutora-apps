import { useCallback, useEffect, useRef, useState } from 'react';
import { streamSolve, OutOfCreditError } from '../services/solve.service';
import { createSession } from '../services/history.service';
import type { ChatTurn, HistoryItem, SubmitMode } from '../types/solve';

export interface SubmitPayload {
  mode: SubmitMode;
  text?: string;
  imageDataUrl?: string;
  wantCanvas?: boolean;
}

interface Options {
  /** Gọi khi bắt đầu 1 phiên mới -> trang điều hướng sang /c/:id. */
  onSessionStart?: (chatId: string) => void;
  onSolved?: () => void;
  onOutOfCredit?: () => void;
}

export const useSolveSession = ({ onSessionStart, onSolved, onOutOfCredit }: Options = {}) => {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string>('');
  const abortRef = useRef<(() => void) | null>(null);
  const modeRef = useRef<SubmitMode>('text');
  const turnsRef = useRef<ChatTurn[]>([]);

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
      // Không chặn ở FE bằng quota mock nữa — BE là nguồn sự thật, hết lượt trả 402.

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
        thinking: '',
        isStreaming: true,
      };
      setTurns((prev) => [...prev, turn]);

      abortRef.current = streamSolve(
        sessionIdRef.current,
        {
          text: payload.text,
          imageBase64: payload.imageDataUrl?.split(',')[1],
          responseFormat: payload.wantCanvas ? 'steps' : 'markdown',
        },
        {
          onDelta: (accumulated) => patchLastTurn({ answer: accumulated }),
          onThinking: (accumulated) => patchLastTurn({ thinking: accumulated }),
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
            onSolved?.(); // refetch balance + history (đã trừ 1 ở BE)
          },
          onError: (err) => {
            setIsStreaming(false);
            patchLastTurn({ isStreaming: false });
            if (err instanceof OutOfCreditError) {
              setError(err.message);
              onOutOfCredit?.();
            } else {
              setError(err.message);
            }
          },
        },
      );
    },
    [isStreaming, onSessionStart, onSolved, onOutOfCredit, patchLastTurn],
  );

  /** Bài mới — reset phiên. */
  const submit = useCallback((payload: SubmitPayload) => send(payload, true), [send]);

  /** Hỏi tiếp trong phiên hiện tại (giữ ngữ cảnh). wantCanvas: xin lời giải từng bước. */
  const sendFollowUp = useCallback(
    (ask: string, imageDataUrl?: string, wantCanvas?: boolean) =>
      send({ mode: imageDataUrl ? 'image' : 'text', text: ask, imageDataUrl, wantCanvas }, false),
    [send],
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
    sessionId: sessionIdRef.current,
    isStreaming,
    error,
    submit,
    sendFollowUp,
    reset,
    loadFromHistory,
  };
};
