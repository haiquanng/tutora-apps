import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { SUBJECTS, groupByTopic } from '../../data/subjects';
import type { Subject } from '../../data/subjects';

interface Props {
  onNavigate: () => void;
}

/**
 * Flyout 2 cấp cho mục "Tài nguyên" (tham khảo Gauth):
 * cột môn -> hover môn mở cột chủ đề/chương bên phải.
 * Phase 1 chỉ Toán mở, môn khác khoá.
 */
export const ResourcesFlyout = ({ onNavigate }: Props) => {
  const [activeId, setActiveId] = useState<string>(SUBJECTS[0].id);
  const navigate = useNavigate();

  const active = SUBJECTS.find((s) => s.id === activeId);
  const topics = active && !active.locked ? groupByTopic(active.chapters) : [];

  const openChapter = (name: string, grade: number) => {
    navigate('/', {
      state: {
        prefill: `Cho mình một bài tập mẫu về "${name}" lớp ${grade} kèm lời giải từng bước.`,
      },
    });
    onNavigate();
  };

  // Mobile xếp dọc (sidebar chỉ rộng 18rem, 2 cột sẽ tràn); desktop 2 cột.
  return (
    <div className="flex max-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-soft lg:flex-row">
      {/* Cột 1: môn */}
      <ul className="max-h-48 shrink-0 overflow-y-auto p-2 lg:max-h-none lg:w-52">
        {SUBJECTS.map((subject: Subject) => {
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

      {/* Cột 2: chủ đề + chương của môn đang chọn */}
      <div className="shrink-0 overflow-y-auto border-t border-navy/10 p-3 lg:w-64 lg:border-l lg:border-t-0">
        {active?.locked && (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <Lock className="size-5 text-navy/25" />
            <p className="mt-2 text-sm font-medium text-navy/50">{active.name} sắp có</p>
            <p className="mt-1 text-xs text-navy/40">Giai đoạn này Tutora tập trung vào môn Toán.</p>
          </div>
        )}

        {topics.map(({ topic, chapters }) => (
          <div key={topic} className="mb-3 last:mb-0">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-navy/40">{topic}</p>
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => openChapter(chapter.name, chapter.grade)}
                className="flex w-full cursor-pointer items-baseline gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-navy/70 transition hover:bg-cream-light hover:text-navy"
              >
                <span className="flex-1">{chapter.name}</span>
                <span className="shrink-0 text-xs text-navy/30">{chapter.grade}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
