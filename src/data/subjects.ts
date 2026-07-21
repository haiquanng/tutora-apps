/**
 * Danh mục Tài nguyên. Phase 1 chỉ mở môn Toán (khớp question bank hiện có),
 * các môn còn lại locked -> hiện badge "Sắp có".
 */
export interface Chapter {
  id: string;
  name: string;
  grade: number;
  /** Nhóm chủ đề để hiện ở flyout cấp 2 (kiểu Gauth: Math > Equation, Function…). */
  topic: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  locked: boolean;
  chapters: Chapter[];
}

/** Gom chương theo nhóm chủ đề, giữ nguyên thứ tự xuất hiện. */
export const groupByTopic = (chapters: Chapter[]): { topic: string; chapters: Chapter[] }[] => {
  const groups = new Map<string, Chapter[]>();
  chapters.forEach((chapter) => {
    const existing = groups.get(chapter.topic);
    if (existing) existing.push(chapter);
    else groups.set(chapter.topic, [chapter]);
  });
  return [...groups].map(([topic, items]) => ({ topic, chapters: items }));
};

export const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'Toán',
    icon: 'Sigma',
    locked: false,
    chapters: [
      { id: 'math-10-sets', name: 'Mệnh đề và tập hợp', grade: 10, topic: 'Đại số' },
      { id: 'math-10-inequality', name: 'Bất phương trình bậc nhất hai ẩn', grade: 10, topic: 'Đại số' },
      { id: 'math-11-sequence', name: 'Dãy số, cấp số cộng, cấp số nhân', grade: 11, topic: 'Đại số' },
      { id: 'math-12-log', name: 'Hàm số mũ và logarit', grade: 12, topic: 'Đại số' },
      { id: 'math-10-trig', name: 'Hệ thức lượng trong tam giác', grade: 10, topic: 'Lượng giác' },
      { id: 'math-11-trig-eq', name: 'Phương trình lượng giác', grade: 11, topic: 'Lượng giác' },
      { id: 'math-11-limit', name: 'Giới hạn và hàm số liên tục', grade: 11, topic: 'Giải tích' },
      { id: 'math-11-derivative', name: 'Đạo hàm', grade: 11, topic: 'Giải tích' },
      { id: 'math-12-variation', name: 'Ứng dụng đạo hàm khảo sát hàm số', grade: 12, topic: 'Giải tích' },
      { id: 'math-12-integral', name: 'Nguyên hàm và tích phân', grade: 12, topic: 'Giải tích' },
      { id: 'math-10-vector', name: 'Vectơ', grade: 10, topic: 'Hình học' },
      { id: 'math-11-space', name: 'Quan hệ vuông góc trong không gian', grade: 11, topic: 'Hình học' },
      { id: 'math-12-oxyz', name: 'Phương pháp toạ độ trong không gian', grade: 12, topic: 'Hình học' },
      { id: 'math-10-stats', name: 'Thống kê', grade: 10, topic: 'Thống kê & Xác suất' },
      { id: 'math-12-prob', name: 'Xác suất có điều kiện', grade: 12, topic: 'Thống kê & Xác suất' },
    ],
  },
  { id: 'physics', name: 'Vật lý', icon: 'Magnet', locked: true, chapters: [] },
  { id: 'chemistry', name: 'Hoá học', icon: 'FlaskConical', locked: true, chapters: [] },
  { id: 'biology', name: 'Sinh học', icon: 'Dna', locked: true, chapters: [] },
  { id: 'literature', name: 'Ngữ văn', icon: 'BookOpen', locked: true, chapters: [] },
  { id: 'english', name: 'Tiếng Anh', icon: 'Languages', locked: true, chapters: [] },
  { id: 'history', name: 'Lịch sử', icon: 'Landmark', locked: true, chapters: [] },
  { id: 'geography', name: 'Địa lý', icon: 'Globe2', locked: true, chapters: [] },
];

export const MATH_SUBJECT = SUBJECTS[0];
