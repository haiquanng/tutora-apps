import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TriangleAlert, PanelRight } from 'lucide-react';
import { ProblemComposer } from '../components/homework/ProblemComposer';
import { SubjectCloud } from '../components/homework/SubjectCloud';
import { GradientText } from '../components/ui/GradientText';
import { Skeleton } from '../components/ui/Skeleton';
import { InlineMath } from '../components/ui/InlineMath';
import { ChatTurnView } from '../components/homework/ChatTurnView';
import { CanvasPanel } from '../components/homework/CanvasPanel';
import { ResizeHandle } from '../components/homework/ResizeHandle';
import { TutorSuggestionBanner } from '../components/tutor/TutorSuggestionBanner';
import { useSolveSession } from '../hooks/useSolveSession';
import type { SubmitPayload } from '../hooks/useSolveSession';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { getHistoryItem } from '../services/history.service';
import { createNote } from '../services/notes.service';
import { savePendingPrompt, takePendingPrompt } from '../services/auth.service';
import { useCanvasStore } from '../stores/canvasStore';
import { useProficiency } from '../hooks/useProficiency';
import { PersonalizationChip } from '../components/homework/PersonalizationChip';

const SAMPLES: { label: string; math: string; text: string }[] = [
  { label: 'Giải phương trình', math: 'x^2 - 5x + 6 = 0', text: 'Giải phương trình x² - 5x + 6 = 0' },
  { label: 'Tính đạo hàm của', math: 'y = x\\ln(x)', text: 'Tính đạo hàm của y = x·ln(x)' },
  { label: 'Tìm giới hạn', math: '\\lim_{x\\to 0}\\frac{\\sin(3x)}{x}', text: 'Tìm giới hạn lim(x→0) sin(3x)/x' },
];

interface Props {
  onSolved: () => void;
  onNotesChange?: () => void;
}

export const HomeworkPage = ({ onSolved, onNotesChange }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  // HomeworkPage giờ LUÔN mounted (không nằm dưới route :chatId) → lấy chatId từ path.
  const chatId = location.pathname.startsWith('/c/') ? decodeURIComponent(location.pathname.slice(3)) : undefined;
  const { user, login } = useAuth();
  const proficiency = useProficiency();

  const [noteSaveState, setNoteSaveState] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  const loadedRef = useRef<string | null>(null);

  const onSessionStart = useCallback(
    (id: string) => {
      loadedRef.current = id;
      setOpenedFromHistory(false);
      navigate(`/c/${id}`);
    },
    [navigate],
  );
  const onOutOfCredit = useCallback(() => {
    toast.error('Bạn đã hết lượt hỏi AI. Nâng cấp để tiếp tục.');
    navigate('/upgrade');
  }, [navigate]);
  const session = useSolveSession({ onSessionStart, onSolved, onOutOfCredit });

  const scrollRef = useRef<HTMLDivElement>(null);
  const { turns, isStreaming, loadFromHistory, reset, sessionId: turnsSessionId } = session;

  const canvas = useCanvasStore();
  const pushVersion = canvas.pushVersion;
  const pushedRef = useRef<Set<string>>(new Set());
  const savingVersionsRef = useRef<Set<string>>(new Set());
  const [draggingCanvas, setDraggingCanvas] = useState(false);

  const [isLoadingHistory, setLoadingHistory] = useState(() => Boolean(chatId));
  // Phiên mở lại từ lịch sử (khác phiên vừa tạo tại chỗ) -> modal gợi ý được tự bật.
  const [openedFromHistory, setOpenedFromHistory] = useState(() => Boolean(chatId));

  /**
   * Dựng version canvas từ các turn đã giải xong.
   */
  useEffect(() => {
    if (!turnsSessionId || isLoadingHistory) return;
    for (const t of turns) {
      if (t.isStreaming) continue;
      if (pushedRef.current.has(t.id)) continue;
      pushedRef.current.add(t.id);

      // Turn không có steps (BE trả markdown) -> không tạo version.
      const wanted = t.wantedCanvas === true;
      if (!t.steps.length) {
        // Học sinh đã bật Canvas mà không nhận được steps -> nói cho biết, đừng im lặng.
        if (wanted) toast.info('Lượt này Tutora trả lời dạng thường nên chưa dựng được canvas.');
        continue;
      }

      pushVersion(
        turnsSessionId,
        {
          label: t.question,
          steps: t.steps,
          answerSummary: t.answer,
          noteSaved: t.noteSaved,
          classification: t.classification,
        },
        wanted,
      );
    }
  }, [turns, pushVersion, isLoadingHistory, turnsSessionId]);

  const closeCanvas = useCallback(() => canvas.close(), [canvas.close]);

  // Lưu version canvas đang xem thành ghi chú (question_notes).
  const saveNote = useCallback(async () => {
    const v = canvas.versions[canvas.current];
    if (!v) return;
    const key = `v${v.createdAt}`;
    if (savingVersionsRef.current.has(key)) return;
    savingVersionsRef.current.add(key);
    setNoteSaveState((s) => ({ ...s, [key]: 'saving' }));
    try {
      const grade = Number(v.classification?.grade);
      await createNote({
        title: v.label.slice(0, 255),
        sourceSessionId: chatId || undefined,
        problemText: v.label,
        solutionSteps: v.steps,
        answerSummary: v.answerSummary,
        chapter: v.classification?.chapter ?? undefined,
        gradeLevel: Number.isFinite(grade) && grade > 0 ? grade : undefined,
        subject: v.classification?.chapter ? 'Toán Học' : undefined,
      });
      setNoteSaveState((s) => ({ ...s, [key]: 'saved' }));
      onNotesChange?.();
    } catch {
      savingVersionsRef.current.delete(key); // lỗi -> cho lưu lại
      setNoteSaveState((s) => ({ ...s, [key]: 'error' }));
    }
  }, [canvas, chatId, onNotesChange]);

  /**
   * Đổi phiên (mở note khác / bài mới) -> reset canvas để không dính version bài cũ.
   */
  const canvasReset = canvas.reset;
  const lastResetRef = useRef<string | null>(null);
  useEffect(() => {
    const key = turnsSessionId || chatId || '';
    if (lastResetRef.current === key) return;
    lastResetRef.current = key;
    canvasReset();
    pushedRef.current = new Set();
    savingVersionsRef.current = new Set();
  }, [chatId, turnsSessionId, canvasReset]);

  const handleSend = useCallback(
    (payload: SubmitPayload, isFollowUp: boolean) => {
      if (!user) {
        savePendingPrompt({ text: payload.text, imageDataUrl: payload.imageDataUrl });
        login();
        return;
      }
      if (isFollowUp) session.sendFollowUp(payload.text ?? '', payload.imageDataUrl, payload.wantCanvas);
      else session.submit(payload);
    },
    [user, login, session],
  );

  useEffect(() => {
    if (!chatId) {
      setLoadingHistory(false);
      setOpenedFromHistory(false);
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
    setOpenedFromHistory(true);
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

  // Cuộn thẳng container (không dùng scrollIntoView) — vùng cuộn nằm trong
  // layout ghim đáy, scrollIntoView sẽ kéo lệch cả khung.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  // Hết lượt được xử lý qua BE (402) -> toast + điều hướng /upgrade; không chặn mock ở đây.
  const blockedReason = undefined;

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
                    sessionId={chatId ?? undefined}
                    onAskStep={(q) => void session.sendFollowUp(q)}
                  />
                ))}
              </div>

              <TutorSuggestionBanner
                sessionId={chatId}
                enabled={!isStreaming}
                autoOpenable={openedFromHistory && !isLoadingHistory}
              />

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
            <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-cream to-transparent" />
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
          {user && (
            <div className="mb-3 flex justify-center">
              <PersonalizationChip profile={proficiency} />
            </div>
          )}
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
