import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactElement } from 'react';
import { Pause, Play } from 'lucide-react';
import { renderToString } from 'react-dom/server';

interface Icon {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  id: number;
}

interface Props {
  icons?: ReactElement[];
  images?: string[];
  showControl?: boolean;
  /** Cạnh canvas (px). Mặc định 400 như bản gốc. */
  size?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;

const iconDrawPx = (size: number) => Math.round(size * (40 / 240));
const iconTexturePx = (size: number) => Math.round(iconDrawPx(size) * dpr * 2);

export function IconCloud({ icons, images, showControl = true, size = 400 }: Props) {
  const drawPx = iconDrawPx(size);
  const texturePx = iconTexturePx(size);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iconPositions, setIconPositions] = useState<Icon[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetRotation, setTargetRotation] = useState<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    distance: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const animationFrameRef = useRef<number>(0);
  const rotationRef = useRef({ x: 0, y: 0 });
  const iconCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const imagesLoadedRef = useRef<boolean[]>([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) setIsPaused(true);
    const handleChange = (e: MediaQueryListEvent) => setIsPaused(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!icons && !images) return;
    const items = icons ?? images ?? [];
    imagesLoadedRef.current = new Array(items.length).fill(false);

    iconCanvasesRef.current = items.map((item, index) => {
      const offscreen = document.createElement('canvas');
      const s = texturePx;
      offscreen.width = s;
      offscreen.height = s;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return offscreen;
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';

      if (images) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = item as string;
        img.onload = () => {
          offCtx.clearRect(0, 0, s, s);
          offCtx.beginPath();
          offCtx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
          offCtx.closePath();
          offCtx.clip();
          offCtx.drawImage(img, 0, 0, s, s);
          imagesLoadedRef.current[index] = true;
        };
      } else {
        const svgString = renderToString(item as ReactElement);
        const img = new Image();
        // encodeURIComponent: btoa vỡ với ký tự ngoài Latin-1 (tên môn tiếng Việt).
        img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
        img.onload = () => {
          offCtx.clearRect(0, 0, s, s);
          // SVG lucide gốc 100px -> phủ kín texture giữ nét vector.
          offCtx.drawImage(img, 0, 0, s, s);
          imagesLoadedRef.current[index] = true;
        };
      }
      return offscreen;
    });
  }, [icons, images, texturePx]);

  useEffect(() => {
    const items = icons ?? images ?? [];
    const numIcons = items.length || 20;
    const offset = 2 / numIcons;
    const increment = Math.PI * (3 - Math.sqrt(5));

    const newIcons: Icon[] = [];
    for (let i = 0; i < numIcons; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;
      newIcons.push({
        x: Math.cos(phi) * r * 100,
        y: y * 100,
        z: Math.sin(phi) * r * 100,
        scale: 1,
        opacity: 1,
        id: i,
      });
    }
    setIconPositions(newIcons);
  }, [icons, images]);

  const handleMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !canvas) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const icon of iconPositions) {
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);
      const rotatedX = icon.x * cosY - icon.z * sinY;
      const rotatedZ = icon.x * sinY + icon.z * cosY;
      const rotatedY = icon.y * cosX + rotatedZ * sinX;
      const screenX = size / 2 + rotatedX;
      const screenY = size / 2 + rotatedY;
      const radius = (drawPx / 2) * ((rotatedZ + 200) / 300);
      const dx = x - screenX;
      const dy = y - screenY;

      if (dx * dx + dy * dy < radius * radius) {
        const targetX = -Math.atan2(icon.y, Math.sqrt(icon.x * icon.x + icon.z * icon.z));
        const targetY = Math.atan2(icon.x, icon.z);
        const currentX = rotationRef.current.x;
        const currentY = rotationRef.current.y;
        const distance = Math.hypot(targetX - currentX, targetY - currentY);
        setTargetRotation({
          x: targetX,
          y: targetY,
          startX: currentX,
          startY: currentY,
          distance,
          startTime: performance.now(),
          duration: Math.min(2000, Math.max(800, distance * 1000)),
        });
        return;
      }
    }

    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (isDragging) {
      rotationRef.current = {
        x: rotationRef.current.x + (e.clientY - lastMousePos.y) * 0.002,
        y: rotationRef.current.y + (e.clientX - lastMousePos.x) * 0.002,
      };
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  // Vòng lặp vẽ.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const animate = () => {
      // Backing store là size×dpr; vẽ theo toạ độ logic (size) rồi scale lên dpr
      // để nét trên màn Retina.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const centerX = size / 2;
      const centerY = size / 2;
      const dx = mousePos.x - centerX;
      const dy = mousePos.y - centerY;
      const speed = 0.001 + (Math.hypot(dx, dy) / Math.hypot(centerX, centerY)) * 0.005;

      if (targetRotation) {
        const elapsed = performance.now() - targetRotation.startTime;
        const p = easeOutCubic(Math.min(1, elapsed / targetRotation.duration));
        rotationRef.current = {
          x: targetRotation.startX + (targetRotation.x - targetRotation.startX) * p,
          y: targetRotation.startY + (targetRotation.y - targetRotation.startY) * p,
        };
        if (elapsed >= targetRotation.duration) setTargetRotation(null);
      } else if (!isDragging && !isPaused) {
        rotationRef.current = {
          x: rotationRef.current.x + (dy / size) * speed,
          y: rotationRef.current.y + (dx / size) * speed,
        };
      }

      iconPositions.forEach((icon, index) => {
        const cosX = Math.cos(rotationRef.current.x);
        const sinX = Math.sin(rotationRef.current.x);
        const cosY = Math.cos(rotationRef.current.y);
        const sinY = Math.sin(rotationRef.current.y);
        const rotatedX = icon.x * cosY - icon.z * sinY;
        const rotatedZ = icon.x * sinY + icon.z * cosY;
        const rotatedY = icon.y * cosX + rotatedZ * sinX;

        ctx.save();
        ctx.translate(centerX + rotatedX, centerY + rotatedY);
        ctx.scale((rotatedZ + 200) / 300, (rotatedZ + 200) / 300);
        // Icon ở mặt sau mờ đi -> tạo cảm giác chiều sâu.
        ctx.globalAlpha = Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200));

        if (iconCanvasesRef.current[index] && imagesLoadedRef.current[index]) {
          ctx.drawImage(iconCanvasesRef.current[index], -drawPx / 2, -drawPx / 2, drawPx, drawPx);
        }
        ctx.restore();
      });

      // Còn ảnh chưa tải xong thì vẫn phải vẽ tiếp dù đang tạm dừng.
      const hasPendingAssets = Boolean(icons || images) && !imagesLoadedRef.current.every((loaded) => loaded);
      if (!isPaused || isDragging || targetRotation !== null || hasPendingAssets) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [icons, images, iconPositions, isDragging, isPaused, mousePos, targetRotation, drawPx, size]);

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={size * dpr}
        height={size * dpr}
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        className="max-w-full cursor-grab rounded-lg active:cursor-grabbing"
        aria-label="Các môn học Tutora hỗ trợ"
        role="img"
      />
      {showControl && (
        <button
          type="button"
          onClick={() => setIsPaused((v) => !v)}
          aria-label={isPaused ? 'Chạy hoạt ảnh' : 'Tạm dừng hoạt ảnh'}
          className="absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded-lg border border-navy/10 bg-white/80 text-navy/60 backdrop-blur transition hover:text-navy"
        >
          {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      )}
    </div>
  );
}
