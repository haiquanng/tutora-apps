import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getTutorSuggestion, setTutorSuggestionEnabled } from '../services/tutorSuggestion.service';
import type { TutorSuggestion } from '../services/tutorSuggestion.service';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';

const DISMISS_KEY = 'TUTORA_tutor_suggest_dismissed';
const AUTO_OPENED_KEY = 'TUTORA_tutor_suggest_auto_opened';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_OPENED_LIMIT = 50;

interface DismissRecord {
  version: string;
  at: number;
}

const readDismissed = (): DismissRecord | null => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as DismissRecord) : null;
  } catch {
    return null;
  }
};

const writeDismissed = (version: string) => {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ version, at: Date.now() } satisfies DismissRecord));
  } catch {
    /* hết chỗ localStorage -> coi như chưa đóng, không chặn UI */
  }
};

const readAutoOpened = (): string[] => {
  try {
    const raw = localStorage.getItem(AUTO_OPENED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

const markAutoOpened = (sessionId: string) => {
  try {
    const next = [sessionId, ...readAutoOpened().filter((id) => id !== sessionId)].slice(0, AUTO_OPENED_LIMIT);
    localStorage.setItem(AUTO_OPENED_KEY, JSON.stringify(next));
  } catch {
    /* hết chỗ -> lần sau tự bật lại, chấp nhận được */
  }
};

/**
 * Gợi ý gia sư cho phiên chat hiện tại.
 *
 * Chỉ gọi API khi người dùng là học sinh
 *
 * @param autoOpenable true khi người dùng MỞ LẠI phiên cũ (không phải đang giải bài) —
 *   lúc đó modal được phép tự bật.
 */
export const useTutorSuggestion = (sessionId?: string, enabled = true, autoOpenable = false) => {
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';
  const [dismissedNow, setDismissedNow] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tutorSuggestion(sessionId ?? ''),
    queryFn: () => getTutorSuggestion(sessionId),
    enabled: Boolean(sessionId) && isStudent && enabled,
    staleTime: 5 * 60_000, // khớp cache 5 phút ở BE
    retry: false, // lỗi thì im lặng, không phá trải nghiệm giải bài
  });

  const dismissed = useMemo(() => {
    if (dismissedNow) return true;
    if (!data?.signalVersion) return false;
    const record = readDismissed();
    if (!record) return false;
    // Tín hiệu đổi (vướng chương khác) -> hiện lại với nội dung mới.
    if (record.version !== data.signalVersion) return false;
    return Date.now() - record.at < DISMISS_TTL_MS;
  }, [data?.signalVersion, dismissedNow]);

  const dismiss = useCallback(() => {
    if (data?.signalVersion) writeDismissed(data.signalVersion);
    setDismissedNow(true);
  }, [data?.signalVersion]);

  // Mở lại một phiên cũ có gợi ý -> bật thẳng modal, khỏi bắt tìm banner ở cuối trang.
  const [autoOpen, setAutoOpen] = useState(false);
  useEffect(() => {
    // Chỉ tự bật khi MỞ LẠI phiên cũ.
    if (!autoOpenable || !sessionId || !data?.shouldShow || dismissed) return;
    if (readAutoOpened().includes(sessionId)) return;
    markAutoOpened(sessionId);
    setAutoOpen(true);
  }, [autoOpenable, sessionId, data?.shouldShow, dismissed]);

  return {
    suggestion: data ?? null,
    isLoading,
    visible: Boolean(data?.shouldShow) && !dismissed,
    dismiss,
    /** Modal nên tự mở lần này không (mở lại phiên cũ có gợi ý). */
    autoOpen,
    clearAutoOpen: useCallback(() => setAutoOpen(false), []),
  };
};

/**
 * Tuỳ chọn bật/tắt gợi ý cho toggle ở menu tài khoản (không gắn với phiên chat nào).
 */
export const useTutorSuggestionPreference = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';

  const { data } = useQuery({
    queryKey: queryKeys.tutorSuggestion(''),
    queryFn: () => getTutorSuggestion(),
    enabled: isStudent,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: setTutorSuggestionEnabled,
    // Optimistic: gạt công tắc phải phản hồi ngay, không đợi round-trip.
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ['tutorSuggestion'] });
      const previous = qc.getQueryData<TutorSuggestion>(queryKeys.tutorSuggestion(''));
      qc.setQueryData<TutorSuggestion>(queryKeys.tutorSuggestion(''), (old) =>
        old ? { ...old, preferenceEnabled: next } : old,
      );
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.tutorSuggestion(''), ctx.previous);
      toast.error('Không lưu được tuỳ chọn. Vui lòng thử lại.');
    },
    onSettled: () => {
      // Tắt thì banner ở mọi phiên phải biến mất ngay, không đợi cache hết hạn.
      void qc.invalidateQueries({ queryKey: ['tutorSuggestion'] });
    },
  });

  return {
    enabled: isStudent ? (data?.preferenceEnabled ?? null) : null,
    setEnabled: mutation.mutate,
    isPending: mutation.isPending,
  };
};
