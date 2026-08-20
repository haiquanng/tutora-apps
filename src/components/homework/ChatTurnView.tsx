import { Loader2, PanelRight } from 'lucide-react';
import { Markdown } from './Markdown';
import { ThinkingBlock } from './ThinkingBlock';
import { AnswerTrustBadge } from './AnswerTrustBadge';
import { VoteButtons } from '../ui/VoteButtons';
import { MESSAGE_REASONS, voteMessage } from '../../services/feedback.service';
import type { ChatTurn } from '../../types/solve';

interface Props {
  turn: ChatTurn;
  onOpenCanvas: (turn: ChatTurn) => void;
  isActiveInPanel?: boolean;
}

export const ChatTurnView = ({ turn, onOpenCanvas, isActiveInPanel }: Props) => {
  const hasSteps = turn.steps.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-cream">
          {turn.image && (
            <img src={turn.image} alt="Đề bài" className="mb-2 max-h-48 rounded-xl border border-cream/20" />
          )}
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{turn.question}</p>
        </div>
      </div>

      {turn.thinking && <ThinkingBlock thinking={turn.thinking} isStreaming={turn.isStreaming} />}

      {/* Trả lời của Tutora — luôn là hội thoại thật, canvas chỉ THÊM VÀO, không thay thế. */}
      {turn.answer && <Markdown>{turn.answer}</Markdown>}

      {hasSteps &&
        // Panel đã đang mở sẵn cho đúng turn này -> khỏi nhắc lại, tránh nhiễu UI.
        !turn.isStreaming &&
        !isActiveInPanel && (
          <button
            type="button"
            onClick={() => onOpenCanvas(turn)}
            className="flex items-center gap-2.5 rounded-2xl border border-navy/12 bg-white px-4 py-3 text-left text-sm text-navy/70 transition hover:border-gold hover:bg-gold/5"
          >
            <PanelRight className="size-4 shrink-0 text-burgundy" />
            <span>
              Mình đã trình bày ở khung canvas bên phải.{' '}
              <span className="text-burgundy underline underline-offset-2">Mở lại</span>
            </span>
          </button>
        )}

      {/* Nhãn tin cậy + vote cùng một hàng: đều là "đánh giá lời giải này". */}
      {!turn.isStreaming && turn.answer && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {turn.messageId && (
            <VoteButtons
              reasons={MESSAGE_REASONS}
              initialVote={turn.myVote}
              onVote={(vote, reason, detail) => voteMessage(turn.messageId!, vote, reason, detail)}
              modalTitle="Lời giải chưa ổn ở đâu?"
              modalDescription="Cho mình biết để cải thiện chất lượng lời giải nhé."
            />
          )}
          <AnswerTrustBadge trust={turn.trust} />
        </div>
      )}

      {turn.isStreaming && (
        <p className="flex items-center gap-2 text-sm text-navy/50">
          <Loader2 className="size-4 animate-spin text-burgundy" />
          {turn.steps.length ? `Đang viết bước ${turn.steps.length + 1}…` : 'Tutora đang trả lời…'}
        </p>
      )}
    </div>
  );
};
