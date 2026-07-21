import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUp, Camera, ImagePlus, X } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import type { SubmitPayload } from '../../hooks/useSolveSession';

interface Props {
  onSubmit: (payload: SubmitPayload) => void;
  disabled?: boolean;
  /** Hết quota -> khoá nộp bài và hiện lý do. */
  blockedReason?: string;

  size?: 'default' | 'hero';
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Ô nhập đề: gõ chữ, tải ảnh, hoặc chụp camera. Hỗ trợ kéo-thả và dán ảnh. */
export const ProblemComposer = ({ onSubmit, disabled, blockedReason, size = 'default' }: Props) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setCameraOpen] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tự phình theo nội dung: reset height về auto rồi đo lại scrollHeight,
  // nếu không nó chỉ tăng mà không co lại khi xoá bớt chữ.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Set height inline sẽ ghi đè min-h-* của Tailwind -> phải tự kẹp sàn ở đây.
    const minHeight = size === 'hero' ? 80 : 0;
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }, [text, size]);

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ hỗ trợ tệp ảnh.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Ảnh tối đa 5MB. Bạn thử chụp lại nhỏ hơn nhé.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(() => {
    if (disabled || blockedReason) return;
    if (image) {
      onSubmit({ mode: 'image', imageDataUrl: image, text: text.trim() || undefined });
    } else if (text.trim()) {
      onSubmit({ mode: 'text', text: text.trim() });
    } else {
      return;
    }
    setText('');
    setImage(null);
  }, [blockedReason, disabled, image, onSubmit, text]);

  const canSubmit = !disabled && !blockedReason && (Boolean(image) || text.trim().length > 0);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) readFile(file);
        }}
        onPaste={(e) => {
          const file = Array.from(e.clipboardData.files)[0];
          if (file) readFile(file);
        }}
        className={`rounded-2xl border bg-white shadow-card transition ${size === 'hero' ? 'px-4 py-3' : 'px-3 py-2'} ${
          isDragging ? 'border-gold bg-cream-light/50' : 'border-navy/15'
        }`}
      >
        {image && (
          <div className="relative mb-3 inline-block">
            <img src={image} alt="Đề bài đã tải lên" className="max-h-48 rounded-2xl border border-navy/10" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute -right-2 -top-2 grid cursor-pointer size-7 place-items-center rounded-full bg-navy text-cream"
              aria-label="Xoá ảnh"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter gửi, Shift+Enter xuống dòng.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          placeholder="Nhập đề bài, dán ảnh, hoặc tải ảnh lên…"
          className="max-h-52 w-full resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-navy outline-none placeholder:text-navy/40"
        />

        {/* Hàng nút gọn: chỉ icon, không nhãn chữ (tham khảo Claude). */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-navy/50 transition hover:bg-cream-light hover:text-navy"
              aria-label="Tải ảnh lên"
              title="Tải ảnh lên"
            >
              <ImagePlus className="size-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-navy/50 transition hover:bg-cream-light hover:text-navy"
              aria-label="Chụp ảnh"
              title="Chụp ảnh"
            >
              <Camera className="size-[18px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="grid size-8 place-items-center rounded-lg bg-burgundy text-cream transition enabled:cursor-pointer enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:bg-navy/15 disabled:text-navy/40"
            aria-label="Gửi bài"
          >
            <ArrowUp className="size-[18px]" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {(error || blockedReason) && <p className="mt-2 px-2 text-sm text-burgundy">{error || blockedReason}</p>}

      {isCameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(dataUrl) => {
            setImage(dataUrl);
            setCameraOpen(false);
          }}
        />
      )}
    </div>
  );
};
