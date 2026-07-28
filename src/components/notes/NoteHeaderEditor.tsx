import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, Tag } from 'lucide-react';
import { useSubjects } from '../../hooks/useSubjects';
import type { UpdateNotePayload } from '../../services/notes.service';

interface Props {
  title: string;
  chapter?: string | null;
  gradeLevel?: number | null;
  onSave: (patch: UpdateNotePayload) => Promise<unknown>;
}

export const NoteHeaderEditor = ({ title, chapter, gradeLevel, onSave }: Props) => {
  const { subjects } = useSubjects();
  const [draft, setDraft] = useState(title);
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(title), [title]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Danh mục chương lấy từ lookup API — không hardcode (chương do CMS quản lý).
  const chapters = subjects.flatMap((s) => s.chapters ?? []);
  const current = chapters.find((c) => c.slug === chapter);

  const commit = async (patch: UpdateNotePayload) => {
    setState('saving');
    try {
      await onSave(patch);
      setState('saved');
      window.setTimeout(() => setState('idle'), 1500);
    } catch {
      setState('idle');
      setDraft(title); // lỗi -> trả về giá trị cũ, không để người dùng tưởng đã lưu
    }
  };

  const commitTitle = () => {
    setEditing(false);
    const next = draft.trim();
    if (!next || next === title) {
      setDraft(title);
      return;
    }
    void commit({ title: next.slice(0, 255) });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitTitle();
            if (e.key === 'Escape') {
              setDraft(title);
              setEditing(false);
            }
          }}
          maxLength={255}
          className="min-w-0 flex-1 rounded-lg border border-gold bg-white px-2 py-1 font-serif text-lg font-bold text-navy outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Bấm để sửa tiêu đề"
          className="group flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-left transition hover:bg-cream-light"
        >
          <span className="truncate font-serif text-lg font-bold text-navy">{title}</span>
          <Pencil className="size-3.5 shrink-0 text-navy/25 transition group-hover:text-navy/60" />
        </button>
      )}

      <div className="flex items-center gap-1.5">
        <Tag className="size-3.5 text-navy/35" />
        <select
          value={chapter ?? ''}
          onChange={(e) => {
            const slug = e.target.value;
            const found = chapters.find((c) => c.slug === slug);
            void commit({
              chapter: slug,
              gradeLevel: found?.grade ?? gradeLevel ?? undefined,
              subject: slug ? 'Toán Học' : undefined,
            });
          }}
          className="cursor-pointer rounded-lg border border-navy/12 bg-white px-2 py-1 text-xs text-navy outline-none transition hover:border-gold focus:border-gold"
        >
          <option value="">Chưa phân loại</option>
          {chapters.map((c) => (
            <option key={`${c.grade}-${c.slug}`} value={c.slug}>
              {c.name} {c.grade ? `(lớp ${c.grade})` : ''}
            </option>
          ))}
        </select>

        {current?.grade && <span className="text-xs text-navy/45">Lớp {current.grade}</span>}

        {state === 'saving' && <Loader2 className="size-3.5 animate-spin text-navy/40" />}
        {state === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-burgundy">
            <Check className="size-3.5" />
            Đã lưu
          </span>
        )}
      </div>
    </div>
  );
};
