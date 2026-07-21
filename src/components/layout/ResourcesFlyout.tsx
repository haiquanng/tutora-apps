import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { useSubjects } from '../../hooks/useSubjects';
import { groupByGrade } from '../../services/lookup.service';

interface Props {
  onNavigate: () => void;
}

export const ResourcesFlyout = ({ onNavigate }: Props) => {
  const { subjects, isLoading, error } = useSubjects();
  const [activeId, setActiveId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeId === null && subjects.length) {
      setActiveId((subjects.find((s) => !s.locked) ?? subjects[0]).id);
    }
  }, [subjects, activeId]);

  const active = subjects.find((s) => s.id === activeId);
  const grades = active && !active.locked ? groupByGrade(active.chapters) : [];

  const openChapter = (name: string, grade: number) => {
    navigate('/', {
      state: { prefill: `Cho mình một bài tập mẫu về "${name}" lớp ${grade} kèm lời giải từng bước.` },
    });
    onNavigate();
  };

  if (error) {
    return (
      <div className="w-64 rounded-2xl border border-navy/10 bg-white p-6 text-sm text-navy/50 shadow-soft">
        {error}
      </div>
    );
  }

  // Skeleton dựng đúng 2 cột của flyout -> mở ra là thấy khung ngay, không nhảy.
  if (isLoading) {
    return (
      <div className="flex max-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-soft lg:flex-row">
        <div className="shrink-0 space-y-1 p-2 lg:w-52">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
        <div className="hidden shrink-0 space-y-2 border-navy/10 p-3 lg:block lg:w-64 lg:border-l">
          <Skeleton className="h-3 w-16" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Mobile xếp dọc (sidebar chỉ rộng 18rem, 2 cột sẽ tràn); desktop 2 cột.
  return (
    <div className="flex max-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-soft lg:flex-row">
      {/* Cột 1: môn */}
      <ul className="max-h-48 shrink-0 overflow-y-auto p-2 lg:max-h-none lg:w-52">
        {subjects.map((subject) => {
          const isActive = subject.id === activeId;
          return (
            <li key={subject.id}>
              {/* KHÔNG dùng thuộc tính disabled: nó chặn cả onMouseEnter nên môn khoá
                  sẽ không phản hồi khi rê chuột. Chặn ở onClick thay thế. */}
              <button
                type="button"
                aria-disabled={subject.locked}
                onMouseEnter={() => setActiveId(subject.id)}
                onFocus={() => setActiveId(subject.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  subject.locked ? 'cursor-not-allowed text-navy/30' : 'cursor-pointer text-navy/70'
                } ${isActive ? 'bg-cream-light font-medium' : 'hover:bg-cream-light/60'} ${
                  isActive && !subject.locked ? 'text-navy' : ''
                }`}
              >
                <span className="flex-1 truncate">{subject.name}</span>
                {subject.locked ? (
                  <Lock className="size-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-navy/30" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Cột 2: chương của môn đang chọn, gom theo khối lớp */}
      <div className="shrink-0 overflow-y-auto border-t border-navy/10 p-3 lg:w-64 lg:border-l lg:border-t-0">
        {active?.locked && (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <Lock className="size-5 text-navy/25" />
            <p className="mt-2 text-sm font-medium text-navy/50">{active.name} sắp có</p>
            <p className="mt-1 text-xs text-navy/40">Giai đoạn này Tutora tập trung vào môn Toán.</p>
          </div>
        )}

        {grades.map(({ grade, chapters }) => (
          <div key={grade} className="mb-3 last:mb-0">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-navy/40">Lớp {grade}</p>
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => openChapter(chapter.name, chapter.grade)}
                className="flex w-full cursor-pointer items-baseline gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-navy/70 transition hover:bg-cream-light hover:text-navy"
              >
                <span className="flex-1">{chapter.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
