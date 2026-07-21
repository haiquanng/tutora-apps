import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Lock } from 'lucide-react';
import { SUBJECTS, groupByTopic } from '../data/subjects';

/**
 * Trang Tài nguyên đầy đủ (deep-link /resources). Sidebar có flyout nhanh cho
 * cùng dữ liệu — xem components/layout/ResourcesFlyout.tsx.
 */
export const ResourcesPage = () => {
  const [openId, setOpenId] = useState<string | null>('math');
  const navigate = useNavigate();

  const openChapter = (name: string, grade: number) =>
    navigate('/', {
      state: { prefill: `Cho mình một bài tập mẫu về "${name}" lớp ${grade} kèm lời giải từng bước.` },
    });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-bold">Tài nguyên</h1>
      <p className="mt-1 text-navy/60">Chọn chương để luyện tập theo đúng chương trình.</p>

      <ul className="mt-6 space-y-2">
        {SUBJECTS.map((subject) => {
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
                  {groupByTopic(subject.chapters).map(({ topic, chapters }) => (
                    <div key={topic} className="mb-4 last:mb-0">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/40">{topic}</p>
                      <div className="flex flex-wrap gap-2">
                        {chapters.map((chapter) => (
                          <button
                            key={chapter.id}
                            type="button"
                            onClick={() => openChapter(chapter.name, chapter.grade)}
                            className="cursor-pointer rounded-full border border-navy/10 px-3 py-1.5 text-sm text-navy/70 transition hover:border-gold hover:text-navy"
                          >
                            {chapter.name}
                            <span className="ml-1.5 text-xs text-navy/30">lớp {chapter.grade}</span>
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
