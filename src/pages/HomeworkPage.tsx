import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { ProblemComposer } from '../components/homework/ProblemComposer';
import { ChatTurnView } from '../components/homework/ChatTurnView';
import { useSolveSession } from '../hooks/useSolveSession';
import type { SubmitPayload } from '../hooks/useSolveSession';
import { useAuth } from '../hooks/useAuth';
import { getHistoryItem } from '../services/history.service';
import { savePendingPrompt, takePendingPrompt } from '../services/auth.service';

const SAMPLES = [
  'Giải phương trình x² - 5x + 6 = 0',
  'Tính đạo hàm của y = x·ln(x)',
  'Tìm giới hạn lim(x→0) sin(3x)/x',
];

interface Props {
  onQuotaChange: () => void;
}

export const HomeworkPage = ({ onQuotaChange }: Props) => {
  const navigate = useNavigate();
  // /c/:chatId -> 1 phiên chat có URL riêng, chia sẻ/refresh được.
  const { chatId } = useParams<{ chatId: string }>();
  const { user, login } = useAuth();

  const onSessionStart = useCallback((id: string) => navigate(`/c/${id}`), [navigate]);
  const session = useSolveSession({ onSessionStart });

  const scrollRef = useRef<HTMLDivElement>(null);
  const { turns, isStreaming, quota, loadFromHistory, reset } = session;

  /**
   * Gác cổng ở lúc GỬI, không chặn cả trang (giống GPT): người dùng cứ gõ thoải mái,
   * bấm gửi mới yêu cầu đăng nhập — và đề bài được giữ lại để quay về gửi tiếp.
   *
   * `isFollowUp` = đang trong một phiên -> hỏi tiếp, giữ nguyên ngữ cảnh.
   */
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

  // Mở URL /c/:id trực tiếp (F5, dán link) -> nạp lại từ lịch sử đã lưu.
  // loadedRef nhớ phiên đang hiển thị để không nạp/reset lặp lại mỗi lần render.
  const loadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (chatId) {
      if (loadedRef.current === chatId) return;
      loadedRef.current = chatId;
      const item = getHistoryItem(chatId);
      // Không có trong lịch sử = phiên vừa tạo (submit đã điều hướng sang đây)
      // -> giữ nguyên state đang stream, KHÔNG reset.
      if (item) loadFromHistory(item);
      return;
    }
    // Về "/" từ một phiên -> xoá hội thoại. Nếu vốn đã ở "/" thì không đụng gì
    // (tránh xoá mất bài vừa gửi từ Tài nguyên).
    if (loadedRef.current !== null) {
      loadedRef.current = null;
      reset();
    }
  }, [chatId, loadFromHistory, reset]);

  // Vừa đăng nhập xong quay về -> gửi tiếp đề đã gõ dở trước đó.
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
  useEffect(() => {
    if (!prefill || !user) return;
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

  // Đang có hội thoại -> bố cục chat: lượt cuộn ở trên, ô nhập ghim đáy.
  if (turns.length > 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-6">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3 py-1.5 text-sm font-medium text-navy/70 transition hover:text-navy"
              >
                <RotateCcw className="size-3.5" />
                Bài mới
              </button>
            </div>

            <div className="space-y-6">
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
          <div className="mx-auto w-full max-w-4xl px-4 pb-4 pt-2">
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-y-auto px-4 py-6 lg:py-10">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-center font-serif text-3xl font-bold leading-tight text-navy sm:text-4xl">
          Trợ lý giải bài tập
          <br />
          <span className="text-burgundy">Hiểu bài, không chỉ chép đáp án</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-navy/60">
          Chụp ảnh, tải ảnh hoặc gõ đề — Tutora giải từng bước theo phương pháp trong sách giáo khoa.
        </p>

        <div className="mt-8">
          <ProblemComposer
            onSubmit={(p) => handleSend(p, false)}
            disabled={isStreaming}
            blockedReason={blockedReason}
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SAMPLES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSend({ mode: 'text', text: sample }, false)}
              className="cursor-pointer rounded-full border border-navy/10 bg-white px-4 py-2 text-sm text-navy/70 transition hover:border-gold hover:text-navy"
            >
              {sample}
            </button>
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
  );
};
