import { useCallback, useEffect, useRef } from 'react';

interface Props {
  /** Gọi liên tục khi kéo, truyền độ rộng panel mới (px, tính từ mép phải màn hình). */
  onResize: (width: number) => void;
  /** Gọi khi thả chuột (kết thúc kéo) -> bật lại transition. */
  onDragEnd?: () => void;
}

export const ResizeHandle = ({ onResize, onDragEnd }: Props) => {
  const draggingRef = useRef(false);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      onResize(window.innerWidth - e.clientX);
    },
    [onResize],
  );

  const stop = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    onDragEnd?.();
  }, [onDragEnd]);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stop);
    };
  }, [onPointerMove, stop]);

  return (
    <div
      onPointerDown={() => {
        draggingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }}
      className="group absolute left-0 top-0 z-10 hidden h-full w-1.5 -translate-x-1/2 cursor-col-resize lg:block"
      aria-label="Kéo để chỉnh độ rộng canvas"
      role="separator"
    >
      {/* Vạch mảnh, đậm lên khi hover để thấy kéo được. */}
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-navy/10 transition group-hover:w-0.5 group-hover:bg-gold" />
    </div>
  );
};
