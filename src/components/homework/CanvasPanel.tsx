import { ChevronLeft, ChevronRight, X, BookmarkPlus, Check, Loader2, History } from 'lucide-react';
import { StepCard } from './StepCard';
import type { SolutionStep } from '../../types/solve';

interface VersionNav {
  total: number;
  current: number;
  onChange: (i: number) => void;
}

interface Props {
  title: string;
  steps: SolutionStep[];
  onClose: () => void;
  version?: VersionNav;
  onSaveNote?: () => void;
  saveState?: 'saving' | 'saved' | 'error';
}

export const CanvasPanel = ({ title, steps, onClose, version, onSaveNote, saveState }: Props) => {
  const hasVersions = version && version.total > 1;

  return (
    <div className="flex h-full flex-col bg-cream-light/50">
      {/* Header panel */}
      <header className="flex items-center gap-2 border-b border-navy/10 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy">{title}</p>
          <p className="text-xs text-navy/45">Lời giải chi tiết</p>
        </div>

        {onSaveNote && (
          <button
            type="button"
            onClick={onSaveNote}
            disabled={saveState === 'saving' || saveState === 'saved'}
            title="Lưu thành Note"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              saveState === 'saved'
                ? 'border-gold/50 bg-gold/10 text-burgundy'
                : 'cursor-pointer border-navy/12 text-navy/70 hover:border-gold hover:text-navy disabled:opacity-60'
            }`}
          >
            {saveState === 'saving' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saveState === 'saved' ? (
              <Check className="size-4" />
            ) : (
              <BookmarkPlus className="size-4" />
            )}
            {saveState === 'saved' ? 'Đã lưu' : saveState === 'saving' ? 'Đang lưu…' : 'Lưu Note'}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng canvas"
          className="cursor-pointer rounded-lg p-2 text-navy/40 transition hover:bg-cream-light hover:text-navy"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Thanh version — chỉ khi có nhiều version. */}
      {hasVersions && (
        <div className="flex items-center gap-2 border-b border-navy/8 bg-white/70 px-4 py-1.5">
          <History className="size-3.5 text-navy/40" />
          <button
            type="button"
            onClick={() => version.onChange(version.current - 1)}
            disabled={version.current === 0}
            className="rounded p-0.5 text-navy/50 transition enabled:cursor-pointer enabled:hover:text-navy disabled:opacity-30"
            aria-label="Version trước"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs font-medium text-navy/60">
            Bản {version.current + 1} / {version.total}
          </span>
          <button
            type="button"
            onClick={() => version.onChange(version.current + 1)}
            disabled={version.current >= version.total - 1}
            className="rounded p-0.5 text-navy/50 transition enabled:cursor-pointer enabled:hover:text-navy disabled:opacity-30"
            aria-label="Version sau"
          >
            <ChevronRight className="size-4" />
          </button>
          {version.current < version.total - 1 && (
            <span className="ml-1 rounded-full bg-cream-light px-2 py-0.5 text-[11px] text-navy/50">bản cũ</span>
          )}
        </div>
      )}

      {/* Nội dung cuộn — TRANG lời giải liền mạch (như tờ giấy làm bài), không ô bước. */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-2xl space-y-5 px-6 py-6">
          {steps.map((step, i) => (
            <StepCard key={step.index} step={step} last={i === steps.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
};
