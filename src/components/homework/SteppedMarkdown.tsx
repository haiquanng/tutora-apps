import { Fragment, useMemo } from 'react';
import { Markdown } from './Markdown';
import { StepExplainer } from './StepExplainer';

interface Props {
  content: string;
  onAskStep?: (question: string) => void;
  disabled?: boolean;
}

const STEP_HEADING = /^\*\*Bước\s+\d+[:.][^\n]*\*\*/gm;

/**
 * Lời giải markdown, nhưng mỗi BƯỚC là một vùng hover được để hỏi rõ hơn.
 */
export const SteppedMarkdown = ({ content, onAskStep, disabled }: Props) => {
  const blocks = useMemo(() => {
    const heads = [...content.matchAll(STEP_HEADING)];
    if (heads.length === 0) return null;

    const out: { title: string; body: string }[] = [];
    // Phần mở đầu trước bước 1 (thường là dòng "**Đáp án:**").
    const lead = content.slice(0, heads[0].index).trim();

    heads.forEach((h, i) => {
      const start = h.index!;
      const end = i + 1 < heads.length ? heads[i + 1].index! : content.length;
      out.push({ title: h[0].replace(/\*\*/g, '').trim(), body: content.slice(start, end).trim() });
    });

    return { lead, steps: out };
  }, [content]);

  // Không có bước, hoặc chưa bật hỏi -> render markdown thường.
  if (!blocks || !onAskStep) return <Markdown>{content}</Markdown>;

  return (
    <div>
      {blocks.lead && <Markdown>{blocks.lead}</Markdown>}
      {blocks.steps.map((s, i) => (
        <Fragment key={i}>
          <StepExplainer stepTitle={s.title} onAsk={onAskStep} disabled={disabled}>
            <Markdown>{s.body}</Markdown>
          </StepExplainer>
        </Fragment>
      ))}
    </div>
  );
};
