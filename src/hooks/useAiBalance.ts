import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getBalance } from '../services/aiCredit.service';
import type { AiCreditBalance } from '../services/aiCredit.service';
import { queryKeys } from '../lib/queryClient';

/** Số dư AI credit THẬT của tài khoản đang đăng nhập (TanStack Query). */
export const useAiBalance = () => {
  const qc = useQueryClient();
  // Giữ CẢ object (không chỉ số) để biết lô nào sắp hết hạn mà nhắc học sinh.
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.aiCreditBalance,
    queryFn: getBalance,
  });

  const onSpent = useCallback(() => {
    qc.setQueryData<AiCreditBalance>(queryKeys.aiCreditBalance, (prev) =>
      prev ? { ...prev, balance: Math.max(0, prev.balance - 1) } : prev,
    );
    // Reconcile với server sau ~1.2s (BE đã trừ xong) — nếu lệch thì lấy số thật.
    window.setTimeout(() => {
      void qc.invalidateQueries({ queryKey: queryKeys.aiCreditBalance });
    }, 1200);
  }, [qc]);

  /** Ép refetch số dư (dùng khi cần đồng bộ tức thì, vd sau khi mua gói). */
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: queryKeys.aiCreditBalance }), [qc]);

  return {
    balance: data?.balance ?? null,
    // Nhắc trước khi mất lượt — học sinh không nên phát hiện lúc số dư tự tụt.
    nextExpiryAt: data?.nextExpiryAt ?? null,
    expiringAmount: data?.expiringAmount ?? 0,
    loading: isLoading,
    onSpent,
    invalidate,
  };
};
