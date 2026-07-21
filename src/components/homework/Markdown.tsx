import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface Props {
  children: string;
}

/** Markdown + LaTeX ($...$, $$...$$) dùng chung cho mọi chỗ hiển thị lời giải. */
export const Markdown = ({ children }: Props) => (
  <div className="text-[15px] leading-relaxed text-navy/80 [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-navy [&_table]:my-3 [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:border-navy/10 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-navy/10 [&_th]:bg-cream-light [&_th]:px-2 [&_th]:py-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  </div>
);
