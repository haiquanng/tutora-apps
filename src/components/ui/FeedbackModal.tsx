import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';

export interface FeedbackReason {
  slug: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, detail?: string) => void;
  reasons: FeedbackReason[];
  title?: string;
  description?: string;
  isPending?: boolean;
}

export const FeedbackModal = ({
  open,
  onClose,
  onSubmit,
  reasons,
  title = 'Góp ý cho chúng mình',
  description = 'Điều gì chưa ổn? Phản hồi của bạn giúp AI trả lời tốt hơn.',
  isPending,
}: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState('');

  const close = () => {
    setSelected(null);
    setDetail('');
    onClose();
  };

  const submit = () => {
    if (!selected) return;
    onSubmit(selected, detail.trim() || undefined);
    setSelected(null);
    setDetail('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>

        <div className="mt-4 flex flex-wrap gap-2">
          {reasons.map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => setSelected(r.slug)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
                selected === r.slug
                  ? 'border-gold bg-gold/10 text-burgundy'
                  : 'border-navy/12 text-navy/70 hover:border-gold hover:text-navy'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Mô tả thêm (không bắt buộc)"
          rows={3}
          maxLength={2000}
          className="mt-3 w-full resize-none rounded-xl border border-navy/12 bg-cream-light/40 px-3 py-2 text-sm text-navy outline-none transition placeholder:text-navy/35 focus:border-gold"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-navy/60 transition hover:text-navy"
          >
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!selected || isPending}
            className="rounded-lg bg-navy px-4 py-1.5 text-sm font-medium text-cream transition enabled:cursor-pointer enabled:hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gửi góp ý
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
