import { useCallback, useEffect, useState } from 'react';
import { fetchGradeLevels, type GradeLevel } from '../services/lookup.service';

/** Danh mục ít đổi -> cache ở module như useSubjects. */
let cache: GradeLevel[] | null = null;
let inflight: Promise<GradeLevel[]> | null = null;

const load = () => {
  if (cache) return Promise.resolve(cache);
  inflight ??= fetchGradeLevels()
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

/**
 * Khối lớp + hàm đổi SỐ LỚP (9..12) sang gradeLevelId (khoá nội bộ 57..60) mà BE nhận.
 * Gửi thẳng số lớp vào BE là lọc sai — không có đề nào khớp.
 */
export const useGradeLevels = () => {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>(cache ?? []);
  const [isLoading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setGradeLevels(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** undefined khi chưa tải xong hoặc không có khối khớp -> BE tự nới tiêu chí. */
  const toGradeLevelId = useCallback(
    (grade: number): number | undefined => gradeLevels.find((g) => g.order === grade)?.id,
    [gradeLevels],
  );

  return { gradeLevels, isLoading, toGradeLevelId };
};
