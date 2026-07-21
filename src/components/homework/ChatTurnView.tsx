import { Loader2 } from 'lucide-react';
import { Markdown } from './Markdown';
import { StepCard } from './StepCard';
import type { ChatTurn, SolutionStep } from '../../types/solve';

interface Props {
  turn: ChatTurn;
  onAsk: (step: SolutionStep, question?: string) => void;
  disabled?: boolean;
}

/**
 * Một lượt hội thoại.
 *
 * - Có steps (bài toán) -> hiện các thẻ bước có thể hỏi sâu thêm.
 * - Không có steps (câu hỏi thường) -> chỉ render markdown như chat bình thường.
 */
export const ChatTurnView = ({ turn, onAsk, disabled }: Props) => (
  <div className="space-y-3">
    {/* Câu hỏi của học sinh — canh phải như chat */}
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-cream">
        {turn.image && (
          <img src={turn.image} alt="Đề bài" className="mb-2 max-h-48 rounded-xl border border-cream/20" />
        )}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{turn.question}</p>
      </div>
    </div>

    {/* Trả lời của Tutora */}
    {turn.steps.length > 0 ? (
      <div className="space-y-3">
        {turn.steps.map((step) => (
          <StepCard key={step.index} step={step} onAsk={onAsk} disabled={disabled} />
        ))}
      </div>
    ) : (
      turn.answer && (
        <div className="pr-6">
          <Markdown>{turn.answer}</Markdown>
        </div>
      )
    )}

    {turn.isStreaming && (
      <p className="flex items-center gap-2 text-sm text-navy/50">
        <Loader2 className="size-4 animate-spin text-burgundy" />
        {turn.steps.length ? `Đang viết bước ${turn.steps.length + 1}…` : 'Tutora đang trả lời…'}
      </p>
    )}
  </div>
);
