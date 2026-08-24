import { Fragment, useMemo } from 'react';
import katex from 'katex';
import { KATEX_OPTIONS } from '../homework/Markdown';

interface Props {
  children: string;
}

export const MathText = ({ children }: Props) => {
  const parts = useMemo(() => {
    return children.split(/(\$[^$]+\$)/g).filter(Boolean);
  }, [children]);

  return (
    <>
      {parts.map((part, i) => {
        const isMath = part.length > 2 && part.startsWith('$') && part.endsWith('$');
        if (!isMath) return <Fragment key={i}>{part}</Fragment>;
        const html = katex.renderToString(part.slice(1, -1), KATEX_OPTIONS);
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </>
  );
};
