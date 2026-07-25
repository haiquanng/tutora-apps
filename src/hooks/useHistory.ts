import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getHistory, removeHistoryItem } from '../services/history.service';
import { queryKeys } from '../lib/queryClient';
import type { HistoryItem } from '../types/solve';

export const useHistory = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.history,
    queryFn: getHistory,
  });

  const reload = useCallback(() => qc.invalidateQueries({ queryKey: queryKeys.history }), [qc]);

  const removeMut = useMutation({
    mutationFn: removeHistoryItem,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: queryKeys.history });
      const prev = qc.getQueryData<HistoryItem[]>(queryKeys.history);
      qc.setQueryData<HistoryItem[]>(queryKeys.history, (old) => (old ?? []).filter((i) => i.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.history, ctx.prev);
    },
    onSettled: () => reload(),
  });

  const remove = useCallback((id: string) => removeMut.mutate(id), [removeMut]);

  return { items: data ?? [], isLoading, reload, remove };
};
