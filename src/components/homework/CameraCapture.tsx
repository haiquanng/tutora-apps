import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface Props {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

/** Modal chụp đề bài bằng camera thiết bị (ưu tiên camera sau trên mobile). */
export const CameraCapture = ({ onCapture, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        // Người dùng đóng modal trước khi cấp quyền -> dừng stream ngay.
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) setError('Không truy cập được camera. Hãy cấp quyền hoặc tải ảnh lên thay thế.');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.9));
  }, [onCapture]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy/95 p-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full p-2 text-cream"
          aria-label="Đóng camera"
        >
          <X className="size-6" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        {error ? (
          <p className="max-w-sm text-center text-cream/80">{error}</p>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="max-h-full max-w-full rounded-2xl" />
        )}
      </div>

      {!error && (
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={capture}
            className="grid size-16 cursor-pointer place-items-center rounded-full bg-cream text-navy transition hover:scale-105"
            aria-label="Chụp ảnh"
          >
            <Camera className="size-7" />
          </button>
        </div>
      )}
    </div>
  );
};
