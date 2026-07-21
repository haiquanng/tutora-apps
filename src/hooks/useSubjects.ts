import { useEffect, useState } from 'react';
import { fetchSubjects } from '../services/lookup.service';
import type { Subject } from '../services/lookup.service';

/** Danh mục ít đổi -> cache ở module, mọi component dùng chung 1 lần gọi. */
let cache: Subject[] | null = null;
let inflight: Promise<Subject[]> | null = null;

const load = () => {
  if (cache) return Promise.resolve(cache);
  // Gộp các lời gọi đồng thời (sidebar + trang Tài nguyên) vào 1 request.
  inflight ??= fetchSubjects()
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>(cache ?? []);
  const [isLoading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setSubjects(data);
      })
      .catch(() => {
        if (!cancelled) setError('Không tải được danh sách môn học.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { subjects, isLoading, error };
};
