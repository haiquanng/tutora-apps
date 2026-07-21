import { api } from './api.service';

/** GET /api/subjects */
interface SubjectDto {
  subjectId: number;
  subjectName: string;
  isActive: boolean;
  slug: string | null;
  iconUrl: string | null;
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

const fetchList = <T>(path: string) => api.get<T[]>(path).then((r) => r ?? []);

/** Danh mục môn + chương: gọi song song 3 endpoint lookup rồi ghép ở FE. */
export const fetchSubjects = async (): Promise<Subject[]> => {
  const [subjects, grades, chapters] = await Promise.all([
    fetchList<SubjectDto>('/subjects'),
    fetchList<GradeLevelDto>('/grade-levels'),
    fetchList<ChapterDto>('/chapters'),
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

/** Gom chương theo khối lớp để hiển thị. */
export const groupByGrade = (chapters: Chapter[]): { grade: number; chapters: Chapter[] }[] => {
  const groups = new Map<number, Chapter[]>();
  chapters.forEach((c) => {
    const list = groups.get(c.grade) ?? [];
    list.push(c);
    groups.set(c.grade, list);
  });
  return [...groups].sort((a, b) => a[0] - b[0]).map(([grade, items]) => ({ grade, chapters: items }));
};
