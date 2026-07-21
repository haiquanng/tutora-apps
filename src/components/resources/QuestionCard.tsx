import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Markdown } from '../homework/Markdown';
import { VoteButtons } from './VoteButtons';
import type { PublicQuestion } from '../../services/questions.service';

interface Props {
  question: PublicQuestion;
  voting?: boolean;
  onVote: (vote: 1 | -1 | 0) => void;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
};

/** 1 câu hỏi mẫu: đề bài + lời giải (thu gọn) + ảnh + vote. */
export const QuestionCard = ({ question, voting, onVote }: Props) => {
  const [showSolution, setShowSolution] = useState(false);
  const difficulty = question.difficulty ? (DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty) : null;

  return (
    <article className="rounded-2xl border border-navy/10 bg-white p-5 shadow-soft">
      {(difficulty || question.questionTypeName) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {difficulty && (
            <span className="rounded-full bg-cream-light px-2.5 py-0.5 text-xs font-medium text-navy/70">
              {difficulty}
            </span>
          )}
          {question.questionTypeName && (
            <span className="rounded-full bg-cream-light px-2.5 py-0.5 text-xs font-medium text-navy/70">
              {question.questionTypeName}
            </span>
          )}
        </div>
      )}

      <Markdown>{question.content}</Markdown>

      {question.imageUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {question.imageUrls.map((url) => (
            <img key={url} src={url} alt="" className="max-h-48 rounded-lg border border-navy/10" />
          ))}
        </div>
      )}

      {question.solution && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowSolution((v) => !v)}
            aria-expanded={showSolution}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-forest transition hover:text-forest/80"
          >
            <ChevronDown className={`size-4 transition ${showSolution ? 'rotate-180' : ''}`} />
            {showSolution ? 'Ẩn lời giải' : 'Xem lời giải'}
          </button>

          {showSolution && (
            <div className="mt-2 rounded-xl bg-cream-light/60 p-4">
              <Markdown>{question.solution}</Markdown>
              {question.solutionSource && (
                <p className="mt-2 text-xs italic text-navy/50">Nguồn: {question.solutionSource}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-navy/5 pt-3">
        <VoteButtons
          likeCount={question.likeCount}
          dislikeCount={question.dislikeCount}
          helpfulPercent={question.helpfulPercent}
          myVote={question.myVote}
          disabled={voting}
          onVote={onVote}
        />
      </div>
    </article>
  );
};
