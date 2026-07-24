import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';

interface Props {
  children: string;
}

/**
 * Markdown + LaTeX ($...$, $$...$$) dùng chung cho mọi chỗ hiển thị lời giải.
 */
export const Markdown = ({ children }: Props) => (
  <div
    className="
      text-[15px] leading-[1.9] text-navy/85
      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
      [&_p]:my-3 [&_p]:leading-[1.9]
      [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:font-serif [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-navy
      [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-navy
      [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-navy
      [&_h4]:mb-1 [&_h4]:mt-4 [&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:text-navy
      [&_strong]:font-semibold [&_strong]:text-navy
      [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5
      [&_li]:my-1.5 [&_li]:pl-0.5 [&_li]:leading-[1.9] [&_li>p]:my-0 [&_li_ul]:my-1 [&_li_ol]:my-1
      [&_hr]:hidden
      [&_blockquote]:my-4 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-2 [&_blockquote]:border-gold
      [&_blockquote]:bg-cream-light/50 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:pr-3
      [&_blockquote>p]:my-1
      [&_code]:rounded [&_code]:bg-cream-light [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px]
      [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-navy [&_pre]:p-4
      [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-cream
      [&_a]:text-burgundy [&_a]:underline [&_a]:underline-offset-2
      [&_table]:my-4 [&_table]:w-full [&_table]:overflow-hidden [&_table]:text-sm
      [&_th]:border [&_th]:border-navy/10 [&_th]:bg-cream-light [&_th]:px-3 [&_th]:py-2 [&_th]:text-left
      [&_td]:border [&_td]:border-navy/10 [&_td]:px-3 [&_td]:py-2
      [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1
      [&_.katex]:leading-normal
      [&_.katex]:my-1 [&_.katex]:inline-block
      [&_.katex-display_.katex]:my-0 [&_.katex-display_.katex]:block
    "
  >
    {/* remarkMath TRƯỚC remarkBreaks để \n trong $$...$$ không bị đổi thành <br>.
        remarkBreaks: \n đơn -> xuống dòng (model xuất mỗi hệ số/công thức 1 dòng bằng \n). */}
    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  </div>
);
