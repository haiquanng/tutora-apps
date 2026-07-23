import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { ProblemComposer } from '../components/homework/ProblemComposer';
import { SubjectCloud } from '../components/homework/SubjectCloud';
import { GradientText } from '../components/ui/GradientText';
import { Skeleton } from '../components/ui/Skeleton';
import { InlineMath } from '../components/ui/InlineMath';
import { ChatTurnView } from '../components/homework/ChatTurnView';
import { useSolveSession } from '../hooks/useSolveSession';
import type { SubmitPayload } from '../hooks/useSolveSession';
import { useAuth } from '../hooks/useAuth';
import { getHistoryItem } from '../services/history.service';
import { savePendingPrompt, takePendingPrompt } from '../services/auth.service';

const SAMPLES: { label: string; math: string; text: string }[] = [
  { label: 'Giải phương trình', math: 'x^2 - 5x + 6 = 0', text: 'Giải phương trình x² - 5x + 6 = 0' },
  { label: 'Tính đạo hàm của', math: 'y = x\\ln(x)', text: 'Tính đạo hàm của y = x·ln(x)' },
  { label: 'Tìm giới hạn', math: '\\lim_{x\\to 0}\\frac{\\sin(3x)}{x}', text: 'Tìm giới hạn lim(x→0) sin(3x)/x' },
];

interface Props {
  onQuotaChange: () => void;
}

export const HomeworkPage = ({ onQuotaChange }: Props) => {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { user, login } = useAuth();

  const onSessionStart = useCallback((id: string) => navigate(`/c/${id}`), [navigate]);
  const session = useSolveSession({ onSessionStart });

  const scrollRef = useRef<HTMLDivElement>(null);
  const { turns, isStreaming, quota, loadFromHistory, reset } = session;

  const handleSend = useCallback(
    (payload: SubmitPayload, isFollowUp: boolean) => {
      if (!user) {
        savePendingPrompt({ text: payload.text, imageDataUrl: payload.imageDataUrl });
        login();
        return;
      }
      if (isFollowUp) session.sendFollowUp(payload.text ?? '', payload.imageDataUrl);
      else session.submit(payload);
    },
    [user, login, session],
  );

  const loadedRef = useRef<string | null>(null);
  const turnsCountRef = useRef(0);
  turnsCountRef.current = turns.length;

  const [isLoadingHistory, setLoadingHistory] = useState(() => Boolean(chatId));

  useEffect(() => {
    if (!chatId) {
      setLoadingHistory(false);
      if (loadedRef.current !== null) {
        loadedRef.current = null;
        reset();
      }
      return;
    }

    if (loadedRef.current === chatId) return;
    if (turnsCountRef.current > 0) {
      loadedRef.current = chatId;
      setLoadingHistory(false);
      return;
    }

    loadedRef.current = chatId;
    setLoadingHistory(true);
    getHistoryItem(chatId)
      .then((item) => {
        if (item) loadFromHistory(item);
      })
      .catch(() => undefined)
      .finally(() => setLoadingHistory(false));
  }, [chatId, loadFromHistory, reset]);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (!user || restoredRef.current) return;
    restoredRef.current = true;
    const pending = takePendingPrompt();
    if (!pending) return;
    session.submit({
      mode: pending.imageDataUrl ? 'image' : 'text',
      text: pending.text,
      imageDataUrl: pending.imageDataUrl,
    });
  }, [user, session]);

  // Chọn 1 chương ở Tài nguyên -> gửi đề luôn (state.prefill).
  const location = useLocation();
  const prefill = (location.state as { prefill?: string } | null)?.prefill;
  const { submit } = session;
  const sentPrefillRef = useRef<string | null>(null);
  useEffect(() => {
    if (!prefill || !user || sentPrefillRef.current === prefill) return;
    sentPrefillRef.current = prefill;
    // Xoá state trước khi submit để F5 không gửi lại đề cũ.
    navigate(location.pathname, { replace: true, state: null });
    submit({ mode: 'text', text: prefill });
  }, [prefill, user, submit, navigate, location.pathname]);

  // Sidebar hiển thị quota -> đồng bộ lại sau mỗi lần trả lời xong.
  useEffect(() => {
    onQuotaChange();
  }, [quota, onQuotaChange]);

  // Cuộn thẳng container (không dùng scrollIntoView) — vùng cuộn nằm trong
  // layout ghim đáy, scrollIntoView sẽ kéo lệch cả khung.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const blockedReason = quota.isExhausted
    ? `Bạn đã dùng hết ${quota.limit} lượt hỏi ${quota.period === 'week' ? 'tuần này' : 'tháng này'}.`
    : undefined;

  if (isLoadingHistory && turns.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-6">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-4">
                <div className="flex justify-end">
                  <Skeleton className="h-12 w-2/5 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 bg-cream">
          <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
            <ProblemComposer onSubmit={() => undefined} disabled blockedReason={blockedReason} />
          </div>
        </div>
      </div>
    );
  }

  // Đang có hội thoại -> bố cục chat: lượt cuộn ở trên, ô nhập ghim đáy.
  if (turns.length > 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {/* max-w-3xl: dòng ngắn hơn -> dễ đọc văn bản dài (như Claude/Gauth). */}
          <div className="mx-auto w-full max-w-3xl px-4 py-6">
            <div className="space-y-10">
              {turns.map((turn) => (
                <ChatTurnView key={turn.id} turn={turn} onAsk={session.askAboutStep} disabled={isStreaming} />
              ))}
            </div>

            {session.error && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
                <TriangleAlert className="size-4 shrink-0" />
                {session.error}
              </p>
            )}
          </div>
        </div>

        {/* Ghim đáy — luôn thấy ô nhập dù hội thoại dài bao nhiêu.
            Không viền ngăn cách: nền liền mạch với vùng cuộn cho gọn. */}
        <div className="relative shrink-0 bg-cream">
          {/* Dải mờ: nội dung cuộn tan dần vào nền thay vì bị cắt ngang đột ngột. */}
          <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-cream to-transparent" />
          <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
            <ProblemComposer
              onSubmit={(p) => handleSend(p, true)}
              disabled={isStreaming}
              blockedReason={blockedReason}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-6">
      <div className="relative w-full max-w-2xl">
        <div className="pointer-events-none absolute inset-x-0 bottom-full flex flex-col items-center pb-3">
          <SubjectCloud />
          <GradientText
            animationSpeed={10}
            className="mt-2 text-center font-serif text-3xl font-bold leading-tight sm:text-4xl"
          >
            AI Hỗ trợ bài tập của bạn
          </GradientText>
        </div>

        <div>
          <ProblemComposer
            onSubmit={(p) => handleSend(p, false)}
            disabled={isStreaming}
            blockedReason={blockedReason}
            size="hero"
          />
        </div>

        {/* Cũng absolute (như cụm trang trí) để không kéo khung chat lệch khỏi tâm. */}
        <div className="absolute inset-x-0 top-full flex flex-wrap justify-center gap-2 pt-4">
          {SAMPLES.map((sample) => (
            <button
              key={sample.text}
              type="button"
              onClick={() => handleSend({ mode: 'text', text: sample.text }, false)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-navy/10 bg-white px-3 py-1.5 text-xs text-navy/60 transition hover:border-gold hover:text-navy"
            >
              <span>{sample.label}</span>
              <InlineMath>{sample.math}</InlineMath>
            </button>
          ))}

          {session.error && (
            <p className="flex w-full items-center justify-center gap-2 rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
              <TriangleAlert className="size-4 shrink-0" />
              {session.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
