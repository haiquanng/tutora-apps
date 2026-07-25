import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getBalance } from '../services/aiCredit.service';
import { queryKeys } from '../lib/queryClient';

/** Số dư AI credit THẬT của tài khoản đang đăng nhập (TanStack Query). */
export const useAiBalance = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.aiCreditBalance,
    queryFn: async () => (await getBalance()).balance,
  });

  const onSpent = useCallback(() => {
    qc.setQueryData<number>(queryKeys.aiCreditBalance, (prev) =>
      typeof prev === 'number' ? Math.max(0, prev - 1) : prev,
    );
    // Reconcile với server sau ~1.2s (BE đã trừ xong) — nếu lệch thì lấy số thật.
    window.setTimeout(() => {
      void qc.invalidateQueries({ queryKey: queryKeys.aiCreditBalance });
    }, 1200);
  }, [qc]);

  /** Ép refetch số dư (dùng khi cần đồng bộ tức thì, vd sau khi mua gói). */
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: queryKeys.aiCreditBalance }), [qc]);

  return { balance: data ?? null, loading: isLoading, onSpent, invalidate };
};
