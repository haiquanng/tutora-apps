const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5166';

/** GET /api/subjects */
interface SubjectDto {
  subjectId: number;
  subjectName: string;
  isActive: boolean;
  slug: string | null;
  iconUrl: string | null;
  /** Cờ do BE quản lý: true = môn mở trong app giải bài tập. */
  isHomeworkEnabled: boolean;
  displayOrder: number;
}

/** GET /api/grade-levels */
interface GradeLevelDto {
  gradeLevelId: number;
  gradeName: string;
  levelOrder: number;
  isActive: boolean;
}

/** GET /api/chapters */
interface ChapterDto {
  id: number;
  subjectId: number;
  gradeLevelId: number;
  slug: string;
  name: string;
  displayOrder: number;
}

export interface Chapter {
  id: number;
  name: string;
  slug: string;
  /** Số lớp thật (9/10/11/12), đã đổi từ gradeLevelId. */
  grade: number;
}

export interface Subject {
  id: number;
  name: string;
  slug: string | null;
  /** URL icon từ BE; null -> FE fallback icon lucide theo tên môn. */
  iconUrl: string | null;
  /** Khoá = BE chưa bật is_homework_enabled cho môn này. */
  locked: boolean;
  chapters: Chapter[];
}

const fetchJson = async <T>(path: string): Promise<T[]> => {
  const response = await fetch(`${BACKEND_URL}/api${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`${path} lỗi ${response.status}`);
  const body = await response.json();
  // BE .NET bọc payload trong { content: ... }.
  return (body?.content ?? body ?? []) as T[];
};

/**
 * Danh mục môn + chương cho trang Tài nguyên, lấy từ lookup API của Tutora-Backend.
 * Gọi song song 3 endpoint rồi ghép lại ở FE (BE không có endpoint gộp sẵn).
 */
export const fetchSubjects = async (): Promise<Subject[]> => {
  const [subjects, grades, chapters] = await Promise.all([
    fetchJson<SubjectDto>('/subjects'),
    fetchJson<GradeLevelDto>('/grade-levels'),
    fetchJson<ChapterDto>('/chapters'),
  ]);

  // gradeLevelId là khoá nội bộ (57..60), levelOrder mới là số lớp hiển thị.
  const gradeOf = new Map(grades.map((g) => [g.gradeLevelId, g.levelOrder]));

  const bySubject = new Map<number, Chapter[]>();
  chapters
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach((c) => {
      const list = bySubject.get(c.subjectId) ?? [];
      list.push({ id: c.id, name: c.name, slug: c.slug, grade: gradeOf.get(c.gradeLevelId) ?? 0 });
      bySubject.set(c.subjectId, list);
    });

  // BE đã sắp theo display_order (môn mở lên đầu do admin đặt) nên FE giữ nguyên,
  // không tự sort. locked lấy thẳng từ cờ is_homework_enabled.
  return subjects
    .filter((s) => s.isActive)
    .map((s) => ({
      id: s.subjectId,
      name: s.subjectName,
      slug: s.slug,
      iconUrl: s.iconUrl,
      locked: !s.isHomeworkEnabled,
      chapters: bySubject.get(s.subjectId) ?? [],
    }));
};

/** Gom chương theo khối lớp để hiển thị (thay cho nhóm chủ đề hardcode trước đây). */
export const groupByGrade = (chapters: Chapter[]): { grade: number; chapters: Chapter[] }[] => {
  const groups = new Map<number, Chapter[]>();
  chapters.forEach((c) => {
    const list = groups.get(c.grade) ?? [];
    list.push(c);
    groups.set(c.grade, list);
  });
  return [...groups].sort((a, b) => a[0] - b[0]).map(([grade, items]) => ({ grade, chapters: items }));
};
