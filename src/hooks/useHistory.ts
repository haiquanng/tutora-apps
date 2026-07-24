import { useCallback, useEffect, useState } from 'react';
import { getHistory, removeHistoryItem } from '../services/history.service';
import type { HistoryItem } from '../types/solve';

export const useHistory = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getHistory()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const remove = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      try {
        await removeHistoryItem(id);
      } catch {
        reload();
      }
    },
    [reload],
  );

  return { items, isLoading, reload, remove };
};
