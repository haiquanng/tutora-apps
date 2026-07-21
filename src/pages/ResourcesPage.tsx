import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Lock, TriangleAlert } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { useSubjects } from '../hooks/useSubjects';
import { groupByGrade } from '../services/lookup.service';

export const ResourcesPage = () => {
  const { subjects, isLoading, error } = useSubjects();
  const [openId, setOpenId] = useState<number | null>(null);
  const navigate = useNavigate();

  const openChapter = (name: string, grade: number) =>
    navigate('/', {
      state: { prefill: `Cho mình một bài tập mẫu về "${name}" lớp ${grade} kèm lời giải từng bước.` },
    });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-bold">Tài nguyên</h1>
      <p className="mt-1 text-navy/60">Chọn chương để luyện tập theo đúng chương trình.</p>

      {/* Skeleton mô phỏng đúng hàng môn học -> không giật layout khi dữ liệu về. */}
      {isLoading && (
        <ul className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-3.5">
              <Skeleton className="h-5 flex-1 max-w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-8 flex items-center gap-2 rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <ul className="mt-6 space-y-2">
        {subjects.map((subject) => {
          const isOpen = openId === subject.id;
          return (
            <li key={subject.id} className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
              <button
                type="button"
                disabled={subject.locked}
                onClick={() => setOpenId(isOpen ? null : subject.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition enabled:cursor-pointer enabled:hover:bg-cream-light/50 disabled:cursor-not-allowed"
              >
                <span className={`flex-1 font-medium ${subject.locked ? 'text-navy/35' : 'text-navy'}`}>
                  {subject.name}
                </span>

                {subject.locked ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-cream-light px-2.5 py-1 text-xs font-medium text-navy/40">
                    <Lock className="size-3" />
                    Sắp có
                  </span>
                ) : (
                  <>
                    <span className="text-xs text-navy/40">{subject.chapters.length} chương</span>
                    <ChevronDown className={`size-4 text-navy/40 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {isOpen && !subject.locked && (
                <div className="border-t border-navy/5 px-4 py-3">
                  {groupByGrade(subject.chapters).map(({ grade, chapters }) => (
                    <div key={grade} className="mb-4 last:mb-0">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/40">Lớp {grade}</p>
                      <div className="flex flex-wrap gap-2">
                        {chapters.map((chapter) => (
                          <button
                            key={chapter.id}
                            type="button"
                            onClick={() => openChapter(chapter.name, chapter.grade)}
                            className="cursor-pointer rounded-full border border-navy/10 px-3 py-1.5 text-sm text-navy/70 transition hover:border-gold hover:text-navy"
                          >
                            {chapter.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
