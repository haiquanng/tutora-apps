import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Markdown } from './Markdown';

interface Props {
  thinking: string;
  isStreaming?: boolean;
}

export const ThinkingBlock = ({ thinking, isStreaming }: Props) => {
  // Đang stream: luôn mở. Xong: mặc định thu gọn (người dùng bấm để mở lại).
  const [open, setOpen] = useState(false);
  const expanded = isStreaming || open;
  const bodyRef = useRef<HTMLDivElement>(null);

  // Đang stream: giữ khung nhìn ở dòng suy nghĩ mới nhất (như Claude).
  useEffect(() => {
    if (isStreaming && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [thinking, isStreaming]);

  return (
    <div className="border-l-2 border-navy/10 pl-3.5">
      <button
        type="button"
        onClick={() => !isStreaming && setOpen((v) => !v)}
        disabled={isStreaming}
        className="group flex w-full items-center gap-1.5 py-0.5 text-left text-[13px] text-navy/40 transition hover:text-navy/60 disabled:cursor-default"
      >
        {isStreaming ? (
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-burgundy/70" />
        ) : (
          <ChevronDown className={`size-3.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
        )}
        <span className="font-medium">{isStreaming ? 'Đang suy nghĩ' : 'Đã suy nghĩ'}</span>
      </button>

      {expanded && (
        <div ref={bodyRef} className={`relative mt-1 ${isStreaming ? 'max-h-40 overflow-hidden' : ''}`}>
          <div className="text-[13px] leading-relaxed text-navy/45 **:text-[13px]! [&_*]:!font-normal [&_*]:!text-navy/45 [&_strong]:!font-medium [&_strong]:!text-navy/55 [&_p]:!my-1.5">
            <Markdown>{thinking}</Markdown>
          </div>
          {/* Đang stream & tràn khung: dòng trên cùng mờ dần vào nền (fade-out kiểu Claude). */}
          {isStreaming && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-cream to-transparent" />
          )}
        </div>
      )}
    </div>
  );
};
