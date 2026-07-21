import { useMemo } from 'react';
import katex from 'katex';

interface Props {
  children: string;
}

export const InlineMath = ({ children }: Props) => {
  const html = useMemo(() => katex.renderToString(children, { throwOnError: false, displayMode: false }), [children]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};
