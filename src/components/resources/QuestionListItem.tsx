import { Link } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';
import { Markdown } from '../homework/Markdown';
import type { PublicQuestion } from '../../services/questions.service';

interface Props {
  question: PublicQuestion;
  /** URL trang chi tiết của câu này. */
  to: string;
}

export const QuestionListItem = ({ question, to }: Props) => {
  const hasVotes = question.likeCount + question.dislikeCount > 0;

  return (
    <Link to={to} className="group flex items-start gap-4 py-4 transition">
      {/* Đề bài — clamp 3 dòng để danh sách gọn, chi tiết xem ở trang trong. */}
      <div className="min-w-0 flex-1 line-clamp-3 [&_*]:!my-0 [&>div]:!text-[13px]">
        <Markdown>{question.content}</Markdown>
      </div>

      {hasVotes && (
        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-forest">
          <ThumbsUp className="size-3.5" />
          {question.helpfulPercent}%
        </span>
      )}
    </Link>
  );
};
