import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface Props {
  stepTitle: string;
  /** Gửi câu hỏi vào hội thoại như một lượt hỏi bình thường. */
  onAsk: (question: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

/**
 * Bọc quanh một bước giải: hover thì hiện nhãn mời hỏi
 */
export const StepExplainer = ({ stepTitle, onAsk, disabled, children }: Props) => (
  <div className="group/step relative -mx-2 rounded-xl px-2 transition hover:bg-cream-light/50">
    {children}

    <button
      type="button"
      disabled={disabled}
      onClick={() => onAsk(`Giải thích rõ hơn giúp mình "${stepTitle}" nhé.`)}
      className="absolute -top-2 right-2 hidden cursor-pointer items-center gap-1 rounded-lg border border-gold bg-white px-2 py-1 text-[11px] font-semibold text-burgundy transition group-hover/step:flex hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <HelpCircle className="size-3" />
      Hỏi rõ hơn bước này
      <span className="font-normal text-navy/50">· 1 lượt</span>
    </button>
  </div>
);
