import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TriangleAlert, PanelRight } from 'lucide-react';
import { ProblemComposer } from '../components/homework/ProblemComposer';
import { SubjectCloud } from '../components/homework/SubjectCloud';
import { GradientText } from '../components/ui/GradientText';
import { Skeleton } from '../components/ui/Skeleton';
import { InlineMath } from '../components/ui/InlineMath';
import { ChatTurnView } from '../components/homework/ChatTurnView';
import { CanvasPanel } from '../components/homework/CanvasPanel';
import { ResizeHandle } from '../components/homework/ResizeHandle';
import { useSolveSession } from '../hooks/useSolveSession';
import type { SubmitPayload } from '../hooks/useSolveSession';
import { useAuth } from '../hooks/useAuth';
import { getHistoryItem } from '../services/history.service';
import { createNote } from '../services/notes.service';
import { savePendingPrompt, takePendingPrompt } from '../services/auth.service';
import { useCanvasStore } from '../stores/canvasStore';

const SAMPLES: { label: string; math: string; text: string }[] = [
  { label: 'Giải phương trình', math: 'x^2 - 5x + 6 = 0', text: 'Giải phương trình x² - 5x + 6 = 0' },
  { label: 'Tính đạo hàm của', math: 'y = x\\ln(x)', text: 'Tính đạo hàm của y = x·ln(x)' },
  { label: 'Tìm giới hạn', math: '\\lim_{x\\to 0}\\frac{\\sin(3x)}{x}', text: 'Tìm giới hạn lim(x→0) sin(3x)/x' },
];

interface Props {
  onQuotaChange: () => void;
  onNotesChange?: () => void;
}

export const HomeworkPage = ({ onQuotaChange, onNotesChange }: Props) => {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { user, login } = useAuth();

  const [noteSaveState, setNoteSaveState] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  const loadedRef = useRef<string | null>(null);

  const onSessionStart = useCallback(
    (id: string) => {
      loadedRef.current = id;
      navigate(`/c/${id}`);
    },
    [navigate],
  );
  const session = useSolveSession({ onSessionStart });

  const scrollRef = useRef<HTMLDivElement>(null);
  const { turns, isStreaming, quota, loadFromHistory, reset, sessionId: turnsSessionId } = session;

  const canvas = useCanvasStore();
  const pushedRef = useRef<Set<string>>(new Set());
  const savingVersionsRef = useRef<Set<string>>(new Set());
  const openNextCanvasRef = useRef(false);
  const [draggingCanvas, setDraggingCanvas] = useState(false);

  const [isLoadingHistory, setLoadingHistory] = useState(() => Boolean(chatId));

  useEffect(() => {
    if (!chatId) return;
    if (turnsSessionId !== chatId || isLoadingHistory) return;
    for (const t of turns) {
      if (t.isStreaming) continue;
      if (!t.steps.length) {
        if (!pushedRef.current.has(t.id)) {
          pushedRef.current.add(t.id);
          openNextCanvasRef.current = false;
        }
        continue;
      }
      if (pushedRef.current.has(t.id)) continue;
      pushedRef.current.add(t.id);
      const autoOpen = openNextCanvasRef.current;
      openNextCanvasRef.current = false;
      canvas.pushVersion(
        chatId,
        {
          label: t.question,
          steps: t.steps,
          answerSummary: t.answer,
          noteSaved: t.noteSaved,
        },
        autoOpen,
      );
    }
  }, [turns, chatId, canvas, isLoadingHistory, turnsSessionId]);

  const closeCanvas = useCallback(() => canvas.close(), [canvas]);

  // Lưu version canvas đang xem thành Note (question_notes).
  const saveNote = useCallback(async () => {
    const v = canvas.versions[canvas.current];
    if (!v) return;
    const key = `v${v.createdAt}`;
    if (savingVersionsRef.current.has(key)) return;
    savingVersionsRef.current.add(key);
    setNoteSaveState((s) => ({ ...s, [key]: 'saving' }));
    try {
      await createNote({
        title: v.label.slice(0, 255),
        sourceSessionId: chatId || undefined,
        problemText: v.label,
        solutionSteps: v.steps,
        answerSummary: v.answerSummary,
      });
      setNoteSaveState((s) => ({ ...s, [key]: 'saved' }));
      onNotesChange?.();
    } catch {
      savingVersionsRef.current.delete(key); // lỗi -> cho lưu lại
      setNoteSaveState((s) => ({ ...s, [key]: 'error' }));
    }
  }, [canvas, chatId, onNotesChange]);

  // Đổi phiên (mở note khác / bài mới) -> reset canvas để không dính version bài cũ.
  useEffect(() => {
    canvas.reset();
    pushedRef.current = new Set();
    savingVersionsRef.current = new Set();
  }, [chatId]);

  const handleSend = useCallback(
    (payload: SubmitPayload, isFollowUp: boolean) => {
      if (!user) {
        savePendingPrompt({ text: payload.text, imageDataUrl: payload.imageDataUrl });
        login();
        return;
      }
      if (payload.wantCanvas) openNextCanvasRef.current = true;
      if (isFollowUp) session.sendFollowUp(payload.text ?? '', payload.imageDataUrl, payload.wantCanvas);
      else session.submit(payload);
    },
    [user, login, session],
  );

  useEffect(() => {
    if (!chatId) {
      setLoadingHistory(false);
      if (loadedRef.current !== null) {
        loadedRef.current = null;
        reset();
      }
      return;
    }

    if (loadedRef.current === chatId) {
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

  if (turns.length > 0) {
    const currentVersion = canvas.versions[canvas.current] ?? null;
    const panelOpen = canvas.isOpen && currentVersion !== null;
    const hasCanvas = canvas.versions.length > 0;
    return (
      <div className="relative flex min-h-0 flex-1">
        {/* Cột CHAT */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {hasCanvas && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-navy/8 bg-cream px-4 py-2">
              <p className="text-xs text-navy">Khi cần chỉnh sửa canvas, vui lòng chọn vào Canvas tại khung chat.</p>
              <button
                type="button"
                onClick={() => (panelOpen ? closeCanvas() : chatId && canvas.open(chatId))}
                aria-pressed={panelOpen}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  panelOpen
                    ? 'border-gold bg-gold/10 text-burgundy'
                    : 'border-navy/12 text-navy/70 hover:border-gold hover:text-navy'
                }`}
              >
                <PanelRight className="size-4" />
                Canvas
                {canvas.versions.length > 1 && (
                  <span className="rounded-full bg-cream-light px-1.5 text-[11px] text-navy/50">
                    {canvas.versions.length}
                  </span>
                )}
              </button>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className={`mx-auto w-full px-4 py-6 ${panelOpen ? 'max-w-none' : 'max-w-3xl'}`}>
              <div className="space-y-10">
                {turns.map((turn) => (
                  <ChatTurnView
                    key={turn.id}
                    turn={turn}
                    onOpenCanvas={() => {
                      if (!chatId) return;
                      const vi = canvas.versions.findIndex((v) => v.label === turn.question);
                      canvas.open(chatId);
                      if (vi >= 0) canvas.goToVersion(vi);
                    }}
                    isActiveInPanel={panelOpen && currentVersion?.label === turn.question}
                  />
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

          {/* Ô nhập ghim đáy cột chat. */}
          <div className="relative shrink-0 bg-cream">
            <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-cream to-transparent" />
            <div className={`mx-auto w-full px-4 pb-4 pt-2 ${panelOpen ? 'max-w-none' : 'max-w-3xl'}`}>
              <ProblemComposer
                onSubmit={(p) => handleSend(p, true)}
                disabled={isStreaming}
                blockedReason={blockedReason}
              />
            </div>
          </div>
        </div>

        {/* Nền mờ mobile — chạm ngoài để đóng. Fade mượt. */}
        <button
          type="button"
          aria-label="Đóng canvas"
          onClick={closeCanvas}
          className={`fixed inset-0 z-20 bg-navy/30 transition-opacity lg:hidden ${
            panelOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <aside
          className={`fixed inset-y-0 right-0 z-30 w-full overflow-hidden lg:static lg:z-0 lg:w-auto lg:shrink-0 lg:border-l lg:border-navy/12 ${
            panelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          } ${draggingCanvas ? '' : 'transition-[width,transform] duration-300 ease-out'}`}
          style={{ width: panelOpen ? undefined : 0 }}
        >
          {/* Wrapper giữ width desktop (mobile full). Bọc riêng để lg:width áp dụng. */}
          <div className="h-full lg:shrink-0" style={{ width: currentVersion ? canvas.width : 0 }}>
            {currentVersion && (
              <>
                <ResizeHandle
                  onResize={(w) => {
                    setDraggingCanvas(true);
                    canvas.setWidth(w);
                  }}
                  onDragEnd={() => setDraggingCanvas(false)}
                />
                <CanvasPanel
                  title={currentVersion.label}
                  steps={currentVersion.steps}
                  onClose={closeCanvas}
                  version={{
                    total: canvas.versions.length,
                    current: canvas.current,
                    onChange: canvas.goToVersion,
                  }}
                  onSaveNote={saveNote}
                  saveState={
                    noteSaveState[`v${currentVersion.createdAt}`] ?? (currentVersion.noteSaved ? 'saved' : undefined)
                  }
                />
              </>
            )}
          </div>
        </aside>
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
